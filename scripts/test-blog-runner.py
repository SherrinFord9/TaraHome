#!/usr/bin/env python3

import argparse
import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from unittest.mock import patch
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


if __name__ == '__main__':
    unittest.main()
