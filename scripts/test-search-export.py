#!/usr/bin/env python3
import importlib.util
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

import openpyxl

spec = importlib.util.spec_from_file_location('search_export', Path(__file__).with_name('analyze-search-export.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SearchExportTests(unittest.TestCase):
    def workbook(self, path, *, days=56, duplicate=False, impressions=10):
        book = openpyxl.Workbook()
        chart = book.active
        chart.title = 'Chart'
        chart.append(['Date', 'Clicks', 'Impressions', 'CTR', 'Position'])
        for index in range(days):
            offset = index - 1 if duplicate and index == 20 else index
            chart.append([date(2026, 7, 1) + timedelta(days=offset), 2 if index < 28 else 1,
                          impressions, 0, 10 if index < 28 else 20])
        queries = book.create_sheet('Queries')
        queries.append(['Top queries', 'Clicks', 'Impressions', 'CTR', 'Position'])
        queries.append(['anonymized rows are absent', 1, 1, 1, 1])
        book.save(path)

    def test_daily_totals_and_low_volume_history(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'export.xlsx'
            self.workbook(file)
            result = module.analyze(file, '2026-09-08')
            self.assertEqual(result['previous28Days']['clicks'], 56)
            self.assertEqual(result['last28Days']['clicks'], 28)
            self.assertEqual(result['fullPeriod']['clicks'], 84)
            self.assertEqual(result['change']['clicksPercent'], -50)
            self.assertIsNone(result['largestSevenDayBreak'])
            self.assertEqual(result['dimensionsFullPeriod']['queries'][0]['Clicks'], 1)

    def test_missing_and_duplicate_dates_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'export.xlsx'
            self.workbook(file, duplicate=True)
            with self.assertRaisesRegex(ValueError, 'missing or duplicate'):
                module.analyze(file, '2026-09-08')
            self.workbook(file, days=28)
            with self.assertRaisesRegex(ValueError, '56 daily'):
                module.analyze(file, '2026-09-08')

    def test_zero_impressions_are_handled(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'export.xlsx'
            self.workbook(file, impressions=0)
            result = module.analyze(file, '2026-09-08')
            self.assertIsNone(result['change']['impressionsPercent'])
            self.assertIsNone(result['largestSevenDayBreak'])
            self.assertEqual(result['last28Days']['ctrPercent'], 0)


if __name__ == '__main__':
    unittest.main()
