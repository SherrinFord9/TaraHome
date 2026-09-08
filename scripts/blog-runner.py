#!/usr/bin/env python3
"""Run the daily writer in an isolated worktree and publish only validated output."""

import argparse
import fcntl
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, time as day_time
from pathlib import Path
from urllib.request import urlopen
from zoneinfo import ZoneInfo

ARTICLE = re.compile(r'blog/([a-z0-9-]+)/index\.html\Z')


def run(args, cwd, timeout=120, **kwargs):
    return subprocess.run(args, cwd=cwd, check=True, text=True, timeout=timeout, **kwargs)


def git(repo, *args):
    return run(['git', *args], repo, stdout=subprocess.PIPE).stdout.strip()


def published_today(repo, day):
    # Count remote main, not an unpushed local commit or stale counter file.
    midnight = datetime.combine(datetime.fromisoformat(day).date(), day_time(), ZoneInfo('America/Los_Angeles')).isoformat()
    dates = git(repo, 'log', 'origin/main', '--since=' + midnight,
                '--format=%H', '--', 'seo/editorial-reviews').splitlines()
    slugs = set()
    for commit in dates:
        files = git(repo, 'diff-tree', '--no-commit-id', '--name-only', '-r', commit, '--', 'seo/editorial-reviews').splitlines()
        for file in files:
            try:
                review = json.loads(git(repo, 'show', commit + ':' + file))
                if review.get('publicationDate') == day and review.get('action') == 'new' and review.get('verdict') == 'PASS':
                    slugs.add(review['slug'])
            except (ValueError, KeyError, subprocess.CalledProcessError):
                continue
    # Also account for articles published outside this runner.
    for file in git(repo, 'log', 'origin/main', '--since=' + midnight, '--diff-filter=A', '--name-only', '--format=', '--', 'blog/*/index.html').splitlines():
        match = ARTICLE.fullmatch(file)
        if match:
            slugs.add(match[1])
    return len(slugs)


def validate_scope(worktree, base):
    if git(worktree, 'rev-parse', 'HEAD') != base:
        raise ValueError('Writer created a commit. Only the runner may commit and push after validation.')
    tracked = git(worktree, 'diff', '--name-only', base).splitlines()
    untracked = git(worktree, 'ls-files', '--others', '--exclude-standard').splitlines()
    changed = sorted(set(tracked + untracked))
    added = git(worktree, 'diff', '--name-only', '--diff-filter=A', base).splitlines()
    new_articles = [file for file in sorted(set(added + untracked)) if ARTICLE.fullmatch(file)]
    if len(new_articles) != 1:
        raise ValueError(f'Expected one new canonical article, found {len(new_articles)}.')
    article = new_articles[0]
    slug = ARTICLE.fullmatch(article)[1]
    allowed_files = {'blog.html', 'blog/index.html', 'sitemap.xml', 'llms.txt', article,
                     f'blog/{slug}.html', f'seo/topic-briefs/{slug}.json', f'seo/editorial-reviews/{slug}.json'}
    for file in changed:
        if file not in allowed_files and not file.startswith(f'assets/generated/blog/{slug}/'):
            raise ValueError('Writer changed a file outside its article: ' + file)
        if not (worktree / file).is_file() or (worktree / file).is_symlink():
            raise ValueError('Deletion, missing file, or symlink is not allowed: ' + file)
    for file in allowed_files:
        if not (worktree / file).is_file():
            raise ValueError('Missing required publish file: ' + file)
    return article, slug, changed


def validate_review(worktree, slug, day):
    review = json.loads((worktree / f'seo/editorial-reviews/{slug}.json').read_text())
    for key, value in {'slug': slug, 'publicationDate': day, 'action': 'new', 'verdict': 'PASS'}.items():
        if review.get(key) != value:
            raise ValueError(f'Editorial review {key} must be {value!r}.')
    for key in ('readerQuestion', 'directAnswer', 'originalContribution', 'limitations', 'proofreadFixes'):
        if not isinstance(review.get(key), str) or len(review[key].strip()) < 30:
            raise ValueError('Editorial review needs a concrete ' + key)
    checks = review.get('claimChecks', [])
    if len(checks) < 3 or any(not row.get('claim') or not str(row.get('sourceUrl', '')).startswith('https://') for row in checks):
        raise ValueError('Editorial review needs at least three claim/source checks.')
    if review.get('noInventedTesting') is not True or review.get('intentComparedAgainstExistingPages') is not True:
        raise ValueError('Editorial review must verify testing claims and existing article overlap.')
    if not review.get('browserChecks', {}).get('desktop') or not review.get('browserChecks', {}).get('mobile'):
        raise ValueError('Editorial review needs desktop and mobile browser observations.')
    return review


def validate(worktree, base, day):
    article, slug, changed = validate_scope(worktree, base)
    review = validate_review(worktree, slug, day)
    brief = json.loads((worktree / f'seo/topic-briefs/{slug}.json').read_text())
    commands = [
        ['bash', 'scripts/check-blog-layout.sh'],
        ['bash', 'scripts/check-blog-typography.sh', '--all'],
        ['bash', 'scripts/check-blog-editorial-copy.sh'],
        ['bash', 'scripts/check-blog-cover-quality.sh'],
        ['python3', str(Path.home() / '.codex/skills/tarahome-blog-research/scripts/check-blog-image-uniqueness.py'), '--repo', str(worktree), '--article', article],
        ['node', 'scripts/check-seo-intent.mjs', '--site'],
        ['node', 'scripts/check-seo-intent.mjs', '--article', article, '--candidate-query', brief['primaryQuery']],
        ['node', 'scripts/check-blog-schedule.mjs', '--article', article, '--lane', 'demand-led'],
        ['node', 'scripts/check-blog-topic-brief.mjs', '--article', article, '--brief', f'seo/topic-briefs/{slug}.json'],
        ['node', 'scripts/check-blog-publish.mjs', '--article', article],
        ['git', 'diff', '--check'],
    ]
    for command in commands:
        run(command, worktree, timeout=180)
    # Recheck after validators so their accidental edits cannot slip into publication.
    article, slug, changed = validate_scope(worktree, base)
    return article, slug, changed, review


def terminate_writer(process):
    import signal
    os.killpg(process.pid, signal.SIGTERM)
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait()


def pending_deployment(repo, status):
    if status.get('state') not in ('pushing', 'deploying', 'failed') or not status.get('article'):
        return False
    commit = status.get('commit', '')
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        return False
    try:
        git(repo, 'merge-base', '--is-ancestor', commit, 'origin/main')
    except subprocess.CalledProcessError:
        return False
    return True


def verify_deployment(repo, commit, article):
    # Remote main and a successful Pages run are separate publication milestones.
    if not shutil.which('gh'):
        raise ValueError('Push succeeded, but gh is unavailable to verify the Pages deployment.')
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        runs = json.loads(run(['gh', 'run', 'list', '--commit', commit, '--limit', '10', '--json',
                              'status,conclusion,url,displayTitle'], repo, stdout=subprocess.PIPE).stdout)
        deployment = next((item for item in runs if 'pages' in item['displayTitle'].lower()), None)
        if deployment and deployment['status'] == 'completed':
            if deployment['conclusion'] != 'success':
                raise ValueError('Pages deployment failed: ' + deployment['url'])
            break
        time.sleep(15)
    else:
        raise ValueError('Push succeeded, but Pages deployment did not complete within ten minutes.')
    with urlopen(article + '?verify=' + commit[:8], timeout=30) as response:
        html = response.read().decode()
        if response.status != 200 or not re.search(
                r'<link\b(?=[^>]*\brel=[\"\']canonical[\"\'])(?=[^>]*\bhref=[\"\']' + re.escape(article) + r'[\"\'])[^>]*>', html):
            raise ValueError('Live article failed status/canonical verification.')
    return deployment['url']


def execute(args):
    repo = args.repo.resolve()
    state = args.state_dir.expanduser().resolve()
    state.mkdir(parents=True, exist_ok=True)
    status_path = state / 'status.json'
    if args.status:
        print(status_path.read_text() if status_path.exists() else 'No runner status recorded yet.')
        return 0
    day = datetime.now(ZoneInfo('America/Los_Angeles')).date().isoformat()
    status = {'date': day, 'startedAt': datetime.now().astimezone().isoformat(), 'state': 'starting'}

    def record(**fields):
        status.update(fields, updatedAt=datetime.now().astimezone().isoformat())
        temp = status_path.with_suffix('.tmp')
        temp.write_text(json.dumps(status, indent=2) + '\n')
        temp.replace(status_path)

    with (state / 'runner.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Another article run is active.')
            return 0
        worktree = None
        try:
            git(repo, 'fetch', 'origin', 'main')
            base = git(repo, 'rev-parse', 'origin/main')
            previous = json.loads(status_path.read_text()) if status_path.exists() else {}
            if not args.dry_run and pending_deployment(repo, previous):
                status.update(previous)
                record(state='deploying', verificationRetried=True)
                deployment = verify_deployment(repo, status['commit'], status['article'])
                record(state='published', deployment=deployment, error=None)
                print('Previously pushed article is now verified: ' + status['article'])
                return 0
            policy = json.loads(git(repo, 'show', 'origin/main:seo/article-schedule.json'))
            if policy['publishing']['newArticlesPerDay'] != 1:
                raise ValueError('This runner supports a maximum of one new article per day.')
            count = published_today(repo, day)
            if args.dry_run:
                print(json.dumps({'date': day, 'base': base, 'newArticlesPublishedToday': count,
                                  'isolatedWorktree': True, 'timeoutMinutes': args.timeout_minutes,
                                  'performanceInput': policy['strategyInputs']['latestSearchPerformance'],
                                  'sourceWorktreeDirty': bool(git(repo, 'status', '--porcelain'))}, indent=2))
                return 0
            if count >= 1:
                if previous.get('date') == day and previous.get('state') == 'published':
                    status.update(previous)
                    record(quotaCheck='met', publishedArticles=count)
                else:
                    record(state='quota_met', publishedArticles=count)
                print('A new article is already on remote main today; no second article will be created.')
                return 0
            attempt = datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + str(os.getpid())
            worktree = state / 'worktrees' / attempt
            worktree.parent.mkdir(parents=True, exist_ok=True)
            git(repo, 'worktree', 'add', '--detach', str(worktree), base)
            log = state / (attempt + '.log')
            last_message = state / (attempt + '.last.md')
            artifacts = state / (attempt + '-artifacts')
            artifacts.mkdir()
            record(state='writing', worktree=str(worktree), log=str(log), artifacts=str(artifacts), base=base)
            prompt = (worktree / 'seo/blog-job.md').read_text()
            prompt += f'\nPublication date: {day}. Work only in {worktree}. Read seo/article-schedule.json for the current strategy input.\n'
            env = dict(os.environ, TARAHOME_BLOG_REQUIRED_LANE='demand-led', TARAHOME_BLOG_DISABLE_COVER_FALLBACK='1',
                       TARAHOME_BLOG_ARTIFACTS=str(artifacts))
            codex = args.codex or shutil.which('codex')
            if not codex:
                raise ValueError('codex is not on PATH; set TARAHOME_CODEX_BIN.')
            with log.open('w') as output:
                process = subprocess.Popen([codex, '--search', '-a', 'never', 'exec', '--sandbox', 'danger-full-access',
                                            '--cd', str(worktree), '--output-last-message', str(last_message), prompt],
                                           cwd=worktree, env=env, stdout=output, stderr=subprocess.STDOUT,
                                           stdin=subprocess.DEVNULL, start_new_session=True)
                try:
                    returncode = process.wait(timeout=args.timeout_minutes * 60)
                except (subprocess.TimeoutExpired, KeyboardInterrupt):
                    terminate_writer(process)
                    raise
            if returncode:
                raise ValueError(f'Writer failed with exit {returncode}; draft preserved at {worktree}')
            record(state='validating')
            article, slug, changed, review = validate(worktree, base, day)
            git(repo, 'fetch', 'origin', 'main')
            if git(repo, 'rev-parse', 'origin/main') != base:
                raise ValueError('Remote main changed during writing. Draft retained for revalidation; no automatic merge.')
            if published_today(repo, day):
                raise ValueError('Another article was published today; draft retained for a later day.')
            git(worktree, 'add', '--', *changed)
            git(worktree, 'commit', '-m', f'Publish {slug}')
            commit = git(worktree, 'rev-parse', 'HEAD')
            record(state='pushing', commit=commit, article='https://tarahome.ai/blog/' + slug + '/')
            git(worktree, 'push', 'origin', 'HEAD:main')
            record(state='deploying', publishedArticles=1)
            deployment = verify_deployment(worktree, commit, status['article'])
            record(state='published', deployment=deployment)
            print(f"Published and verified {status['article']} ({commit[:8]})")
            try:
                git(repo, 'worktree', 'remove', str(worktree))
            except subprocess.CalledProcessError as error:
                record(cleanupWarning=str(error), worktreePreserved=True)
                print('Published article is verified; local verification artifacts were retained.')
            return 0
        except Exception as error:
            record(state='failed', error=str(error), draftPreserved=bool(worktree and worktree.exists()))
            print('Article run FAILED: ' + str(error), file=sys.stderr)
            print('Status: ' + str(status_path), file=sys.stderr)
            return 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--state-dir', type=Path, default=Path(os.environ.get('TARAHOME_BLOG_STATE_DIR', '~/.local/state/tarahome-blog-run')))
    parser.add_argument('--codex', default=os.environ.get('TARAHOME_CODEX_BIN'))
    parser.add_argument('--timeout-minutes', type=int, default=60)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--status', action='store_true')
    args = parser.parse_args()
    if not 1 <= args.timeout_minutes <= 120:
        parser.error('--timeout-minutes must be between 1 and 120')
    return execute(args)


if __name__ == '__main__':
    sys.exit(main())
