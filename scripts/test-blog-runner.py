#!/usr/bin/env python3

import argparse
import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from types import SimpleNamespace
from pathlib import Path

spec = importlib.util.spec_from_file_location('blog_runner', Path(__file__).with_name('blog-runner.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.repo = self.root / 'repo'
        self.repo.mkdir()
        self.command('init', '-b', 'main')
        self.command('config', 'user.name', 'Runner Test')
        self.command('config', 'user.email', 'runner@example.invalid')
        self.write('index.html', 'Protected homepage')
        self.write('seo/article-schedule.json', json.dumps({'publishing': {'newArticlesPerDay': 1}, 'strategyInputs': {'latestSearchPerformance': 'seo/search-performance-test.json'}}))
        self.write('seo/blog-job.md', 'Test writer prompt')
        self.command('add', '.')
        self.command('commit', '-m', 'Initial site')
        self.base = self.command('rev-parse', 'HEAD')
        self.remote = self.root / 'remote.git'
        subprocess.run(['git', 'clone', '--bare', str(self.repo), str(self.remote)], check=True, capture_output=True)
        self.command('remote', 'add', 'origin', str(self.remote))
        self.command('fetch', 'origin')

    def tearDown(self):
        self.temp.cleanup()

    def command(self, *args):
        return subprocess.run(['git', *args], cwd=self.repo, check=True, text=True, capture_output=True).stdout.strip()

    def write(self, name, value):
        file = self.repo / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(value)

    def article(self, slug='test-guide'):
        for name in ['blog.html', 'blog/index.html', 'sitemap.xml', 'llms.txt', f'blog/{slug}/index.html', f'blog/{slug}.html', f'seo/topic-briefs/{slug}.json', f'seo/editorial-reviews/{slug}.json']:
            self.write(name, '{}')

    def test_untracked_and_staged_new_article_are_accepted(self):
        self.article()
        self.assertEqual(runner.validate_scope(self.repo, self.base)[1], 'test-guide')
        self.command('add', '.')
        self.assertEqual(runner.validate_scope(self.repo, self.base)[1], 'test-guide')

    def test_homepage_edit_and_second_article_are_blocked(self):
        self.article()
        self.write('index.html', 'Accidental homepage rewrite')
        with self.assertRaisesRegex(ValueError, 'outside its article'):
            runner.validate_scope(self.repo, self.base)
        self.write('index.html', 'Protected homepage')
        self.write('blog/second/index.html', 'Extra article')
        with self.assertRaisesRegex(ValueError, 'found 2'):
            runner.validate_scope(self.repo, self.base)

    def test_writer_commit_is_blocked(self):
        self.article()
        self.command('add', '.')
        self.command('commit', '-m', 'Bypassed validation')
        with self.assertRaisesRegex(ValueError, 'Only the runner'):
            runner.validate_scope(self.repo, self.base)

    def test_commercial_image_gate_failure_blocks_validation(self):
        self.article()
        self.write('seo/topic-briefs/test-guide.json', json.dumps({'primaryQuery': 'test question'}))

        def fail_delivery(command, *args, **kwargs):
            if 'scripts/check-commercial-images.py' in command:
                raise subprocess.CalledProcessError(1, command)

        with patch.object(runner, 'validate_scope', return_value=('blog/test-guide/index.html', 'test-guide', [])), \
             patch.object(runner, 'validate_review', return_value={}), \
             patch.object(runner, 'run', side_effect=fail_delivery) as run:
            with self.assertRaises(subprocess.CalledProcessError):
                runner.validate(self.repo, self.base, '2026-09-15')
            self.assertIn('scripts/check-commercial-images.py', run.call_args.args[0])

    def test_local_unpushed_article_does_not_satisfy_remote_quota(self):
        from datetime import datetime
        from zoneinfo import ZoneInfo
        self.article()
        self.command('add', '.')
        self.command('commit', '-m', 'Local draft commit')
        day = datetime.now(ZoneInfo('America/Los_Angeles')).date().isoformat()
        self.assertEqual(runner.published_today(self.repo, day), 0)
        self.command('push', 'origin', 'main')
        self.command('fetch', 'origin')
        self.assertEqual(runner.published_today(self.repo, day), 1)

    def test_dirty_source_does_not_block_run_and_failures_are_preserved(self):
        self.write('index.html', 'User edit must survive')
        self.write('unfinished-draft.txt', 'Existing unfinished work')
        before = self.command('status', '--porcelain')
        args = argparse.Namespace(repo=self.repo, state_dir=self.root / 'state', status=False,
                                  dry_run=False, codex='/bin/false', timeout_minutes=1)
        self.assertEqual(runner.execute(args), 1)
        status = json.loads((args.state_dir / 'status.json').read_text())
        self.assertEqual(status['state'], 'failed')
        self.assertTrue(status['draftPreserved'])
        self.assertTrue(Path(status['worktree']).is_dir())
        self.assertEqual(before, self.command('status', '--porcelain'))
        self.assertEqual(self.base, self.command('rev-parse', 'origin/main'))

    def test_pushed_but_unverified_article_retries_verification_before_quota(self):
        self.article()
        self.command('add', '.')
        self.command('commit', '-m', 'Pushed article awaiting deployment')
        self.command('push', 'origin', 'main')
        self.command('fetch', 'origin')
        state = self.root / 'state'
        state.mkdir()
        status_path = state / 'status.json'
        status_path.write_text(json.dumps({'state': 'failed', 'commit': self.command('rev-parse', 'HEAD'),
                                          'article': 'https://tarahome.ai/blog/test-guide/'}))
        args = argparse.Namespace(repo=self.repo, state_dir=state, status=False,
                                  dry_run=False, codex='/bin/false', timeout_minutes=1)
        with patch.object(runner, 'verify_deployment', side_effect=ValueError('Pages failed')):
            self.assertEqual(runner.execute(args), 1)
        self.assertEqual(json.loads(status_path.read_text())['state'], 'failed')
        with patch.object(runner, 'verify_deployment', return_value='https://example.invalid/run') as verify:
            self.assertEqual(runner.execute(args), 0)
            verify.assert_called_once()
        self.assertEqual(json.loads(status_path.read_text())['state'], 'published')

    def test_symlink_article_assets_are_rejected(self):
        self.article()
        link = self.repo / 'assets/generated/blog/test-guide/cover.png'
        link.parent.mkdir(parents=True)
        link.symlink_to(self.repo / 'index.html')
        with self.assertRaisesRegex(ValueError, 'symlink'):
            runner.validate_scope(self.repo, self.base)

    def test_dry_run_and_quota_check_preserve_verified_publication(self):
        from datetime import datetime
        from zoneinfo import ZoneInfo
        self.article()
        self.command('add', '.')
        self.command('commit', '-m', 'Today article')
        self.command('push', 'origin', 'main')
        state = self.root / 'state'
        state.mkdir()
        status = {'date': datetime.now(ZoneInfo('America/Los_Angeles')).date().isoformat(),
                  'state': 'published', 'article': 'https://tarahome.ai/blog/test-guide/',
                  'commit': self.command('rev-parse', 'HEAD'), 'deployment': 'https://example.invalid/run'}
        status_path = state / 'status.json'
        status_path.write_text(json.dumps(status))
        args = argparse.Namespace(repo=self.repo, state_dir=state, status=False,
                                  dry_run=True, codex='/bin/false', timeout_minutes=1)
        self.assertEqual(runner.execute(args), 0)
        self.assertEqual(json.loads(status_path.read_text()), status)
        args.dry_run = False
        self.assertEqual(runner.execute(args), 0)
        result = json.loads(status_path.read_text())
        for key, value in status.items():
            self.assertEqual(result[key], value)
        self.assertEqual(result['quotaCheck'], 'met')


class DeploymentVerificationTests(unittest.TestCase):
    def setUp(self):
        self.commit = 'a' * 40
        self.article = 'https://tarahome.ai/blog/test-guide/'
        self.html = '<html><link rel="canonical" href="' + self.article + '"><p>Reviewed article</p></html>\n'
        self.runs = []
        self.builds = [{'commit': self.commit, 'status': 'built', 'url': 'https://api.github.com/builds/1'}]
        self.api_error = False

    def command(self, command, *args, **kwargs):
        if command[:2] == ['git', 'show']:
            self.assertEqual(command[2], self.commit + ':blog/test-guide/index.html')
            return SimpleNamespace(stdout=self.html)
        if command[:3] == ['gh', 'run', 'list']:
            self.assertIn(self.commit, command)
            return SimpleNamespace(stdout=json.dumps(self.runs))
        if command[:2] == ['gh', 'api']:
            if self.api_error:
                raise subprocess.CalledProcessError(1, command)
            return SimpleNamespace(stdout=json.dumps(self.builds))
        self.fail('Unexpected command: ' + repr(command))

    def response(self, body=None):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = 200
        response.read.return_value = self.html.encode() if body is None else body
        return response

    def verify(self, responses=None):
        with patch.object(runner.shutil, 'which', return_value='/usr/bin/gh'), \
             patch.object(runner, 'run', side_effect=self.command), \
             patch.object(runner.time, 'monotonic', side_effect=[0, 1, 2, 601]), \
             patch.object(runner.time, 'sleep'), \
             patch.object(runner, 'urlopen', side_effect=responses or [self.response(), self.response()]) as fetch:
            result = runner.verify_deployment(Path('/unused'), self.commit, self.article)
            self.assertEqual(fetch.call_args.args[0].full_url, self.article + '?verify=' + self.commit)
            return result

    def test_pages_record_handles_stale_workflow_commit_metadata(self):
        self.assertEqual(self.verify(), 'https://api.github.com/builds/1')

    def test_matching_workflow_still_works_without_pages_api(self):
        self.runs = [{'displayTitle': 'pages build and deployment', 'status': 'completed',
                      'conclusion': 'success', 'url': 'https://github.com/run/1'}]
        self.api_error = True
        self.assertEqual(self.verify(), 'https://github.com/run/1')

    def test_successful_pages_build_can_follow_a_failed_workflow_attempt(self):
        self.runs = [{'displayTitle': 'pages build and deployment', 'status': 'completed',
                      'conclusion': 'failure', 'url': 'https://github.com/run/old'}]
        self.assertEqual(self.verify(), 'https://api.github.com/builds/1')

    def test_cancelled_workflow_does_not_abort_a_pending_build(self):
        self.runs = [{'displayTitle': 'pages build and deployment', 'status': 'completed',
                      'conclusion': 'cancelled', 'url': 'https://github.com/run/cancelled'}]
        self.builds[0]['status'] = 'building'
        with self.assertRaisesRegex(ValueError, 'could not be verified'):
            self.verify()

    def test_other_commit_cannot_satisfy_verification(self):
        self.builds[0]['commit'] = 'b' * 40
        with self.assertRaisesRegex(ValueError, 'could not be verified'):
            self.verify()

    def test_built_record_with_stale_html_is_not_success(self):
        stale = self.html.replace('Reviewed article', 'Older article').encode()
        with self.assertRaisesRegex(ValueError, 'does not yet match'):
            self.verify([self.response(stale), self.response(stale)])

    def test_matching_bytes_with_wrong_canonical_are_rejected(self):
        self.html = self.html.replace(self.article, 'https://tarahome.ai/blog/wrong-guide/')
        with self.assertRaisesRegex(ValueError, 'does not yet match'):
            self.verify()

    def test_cdn_propagation_retries_without_republishing(self):
        stale = self.html.replace('Reviewed article', 'Older article').encode()
        self.assertEqual(self.verify([self.response(stale), self.response()]), 'https://api.github.com/builds/1')

    def test_temporary_live_failure_retries(self):
        from urllib.error import URLError
        self.assertEqual(self.verify([URLError('temporary outage'), self.response()]), 'https://api.github.com/builds/1')

    def test_failed_build_is_not_success(self):
        self.builds[0]['status'] = 'errored'
        with self.assertRaisesRegex(ValueError, 'Pages build failed'):
            self.verify()

    def test_current_html_without_completed_build_is_not_success(self):
        self.builds[0]['status'] = 'building'
        with self.assertRaisesRegex(ValueError, 'could not be verified'):
            self.verify()

    def test_missing_build_access_does_not_claim_publication(self):
        self.api_error = True
        with self.assertRaisesRegex(ValueError, 'records are temporarily unavailable'):
            self.verify()


if __name__ == '__main__':
    unittest.main()
