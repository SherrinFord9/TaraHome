#!/usr/bin/env python3
"""Compare GSC segments and historical HTML changes without inferring causality."""

import argparse
import json
import math
import re
import subprocess
from datetime import date, datetime, timedelta
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

import openpyxl


class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.active = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'title':
            self.active = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.active = False

    def handle_data(self, data):
        if self.active:
            self.parts.append(data)


def title(html):
    parser = TitleParser()
    parser.feed(html)
    return ' '.join(''.join(parser.parts).split())


def git(repo, *args, optional=False):
    result = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, text=True)
    if result.returncode and not optional:
        raise ValueError(result.stderr.strip())
    return None if result.returncode else result.stdout


def change_cohort(repo, commit, url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.netloc != 'tarahome.ai':
        raise ValueError('Unexpected page URL: ' + url)
    if parsed.query or parsed.fragment:
        return {'cohort': 'nonCanonicalPageVariant'}
    path = parsed.path.lstrip('/')
    if not re.fullmatch(r'(?:[a-z0-9-]+/)*', path):
        raise ValueError('Expected canonical trailing-slash URL: ' + url)
    filename = path + 'index.html'
    before = git(repo, 'show', f'{commit}^:{filename}', optional=True)
    after = git(repo, 'show', f'{commit}:{filename}', optional=True)
    if before is None or after is None:
        return {'cohort': 'notPresentInBothRevisions'}
    if before == after:
        return {'cohort': 'unchangedHtml'}
    if title(before) != title(after):
        return {'cohort': 'titleChanged', 'beforeTitle': title(before), 'afterTitle': title(after)}
    return {'cohort': 'otherHtmlChanged'}


def comparison_table(sheet):
    rows = list(sheet.values)
    columns = {}
    for index, header in enumerate(rows[0][1:], 1):
        match = re.fullmatch(r'(\d+/\d+/\d+) - (\d+/\d+/\d+) (Clicks|Impressions|CTR|Position)', str(header))
        if not match:
            raise ValueError('Expected dated comparison columns, not cumulative metrics')
        start, end = [datetime.strptime(value, '%m/%d/%y').date().isoformat() for value in match.group(1, 2)]
        key = (start, end, match[3])
        if key in columns:
            raise ValueError('Duplicate metric column')
        columns[key] = index
    periods = sorted({(start, end) for start, end, _ in columns})
    if len(periods) != 2 or periods[0][1] >= periods[1][0]:
        raise ValueError('Expected two non-overlapping periods')
    lengths = [(date.fromisoformat(end) - date.fromisoformat(start)).days + 1 for start, end in periods]
    if min(lengths) < 1 or lengths[0] != lengths[1]:
        raise ValueError('Comparison periods must have equal positive lengths')
    if any((start, end, metric) not in columns for start, end in periods for metric in ('Clicks', 'Impressions')):
        raise ValueError('Missing comparison counts')
    result, seen = [], set()
    for row in rows[1:]:
        label = row[0]
        if not isinstance(label, str) or not label or label in seen:
            raise ValueError('Missing or duplicate segment label')
        seen.add(label)
        item = {'label': label}
        for side, (start, end) in zip(('before', 'after'), periods):
            item[side] = {}
            for metric in ('Clicks', 'Impressions'):
                value = row[columns[(start, end, metric)]]
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0 or value != int(value):
                    raise ValueError('Invalid comparison count')
                item[side][metric.lower()] = int(value)
        result.append(item)
    return periods, result


def totals(rows):
    return {side: {metric: sum(row[side][metric] for row in rows) for metric in ('clicks', 'impressions')} for side in ('before', 'after')}


def summarize(rows):
    result = totals(rows)
    before, after = result['before']['impressions'], result['after']['impressions']
    result.update(rows=len(rows), rowsWithFewerImpressions=sum(row['after']['impressions'] < row['before']['impressions'] for row in rows),
                  impressionsChangePercent=round((after / before - 1) * 100, 2) if before else None)
    return result


def daily_totals(daily, periods):
    by_date = {row['date']: row for row in daily}
    if len(by_date) != len(daily):
        raise ValueError('Duplicate daily date')
    result = {}
    for side, (start, end) in zip(('before', 'after'), periods):
        rows = []
        day = date.fromisoformat(start)
        while day <= date.fromisoformat(end):
            if day.isoformat() not in by_date:
                raise ValueError('Daily series does not cover comparison periods')
            rows.append(by_date[day.isoformat()])
            day += timedelta(days=1)
        result[side] = {metric: sum(row[metric] for row in rows) for metric in ('clicks', 'impressions')}
    return result


def analyze(source, performance, repo, ref):
    commit = git(repo, 'rev-parse', '--verify', ref + '^{commit}').strip()
    git(repo, 'rev-parse', '--verify', commit + '^')
    workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
    try:
        parsed = {name: comparison_table(workbook[name]) for name in ('Pages', 'Countries', 'Devices')}
        filters = dict(list(workbook['Filters'].values)[1:])
    finally:
        workbook.close()
    if filters.get('Search type') != 'Web' or set(filters) - {'Search type', 'Date'}:
        raise ValueError('Expected unfiltered Web comparison')
    periods = parsed['Devices'][0]
    if any(value[0] != periods for value in parsed.values()):
        raise ValueError('Periods differ across sheets')
    performance_data = json.loads(performance.read_text())
    site = daily_totals(performance_data['daily'], periods)
    if totals(parsed['Devices'][1]) != site or totals(parsed['Countries'][1]) != site:
        raise ValueError('Segment totals do not match the daily site totals; check filters or incomplete exports')
    pages = []
    for row in parsed['Pages'][1]:
        pages.append({**row, 'kind': 'article' if re.fullmatch(r'https://tarahome\.ai/blog/[a-z0-9-]+/', row['label']) else 'other',
                      **change_cohort(repo, commit, row['label'])})
    cohorts = {}
    for name in sorted({row['cohort'] for row in pages if row['kind'] == 'article'}):
        baseline = [row for row in pages if row['kind'] == 'article' and row['cohort'] == name and row['before']['impressions'] > 0]
        cohorts[name] = summarize(baseline)
    commit_date = git(repo, 'show', '-s', '--format=%cI', commit).strip()
    return {
        'comparisonSource': source.name,
        'dailySource': performance.name,
        'changeCommit': commit,
        'changeCommitDate': commit_date,
        'baselineIncludesCommitDate': periods[0][0] <= commit_date[:10] <= periods[0][1],
        'periods': dict(zip(('before', 'after'), [{'start': start, 'end': end} for start, end in periods])),
        'siteTotalsFromDailySeries': site,
        'devices': parsed['Devices'][1],
        'countries': sorted(parsed['Countries'][1], key=lambda row: row['before']['impressions'], reverse=True),
        'articleCohortsWithBaselineImpressions': cohorts,
        'pageAggregationTotalsNotSiteTotals': totals(pages),
        'pages': pages,
        'limits': [
            'These are historical date comparisons, not a current ranking report or a causal experiment.',
            'A baseline containing the commit date is not a clean pre-change period. Commit time is not verified deployment or recrawl time.',
            'Cohorts compare article HTML in one commit with its first parent. Unchanged HTML is not an untreated control: shared assets, internal links, later edits, competition and site-wide signals may affect it.',
            'Cohort aggregates include only exported articles with baseline impressions. All page rows remain available, including newly visible pages.',
            'Page impressions can exceed site impressions because Google aggregates them differently. Query rows are intentionally not used as site totals.',
            'Fragment/query page rows are retained separately, not merged into canonical-page cohorts.',
            'Missing rows are not proof of nonindexing. A title in Git is not necessarily the title Google showed.',
            'This comparison does not reveal historical indexing state, search demand, real inquiries or revenue.',
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('--performance', type=Path, required=True)
    parser.add_argument('--repo', type=Path, default=Path.cwd())
    parser.add_argument('--change-ref', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = analyze(args.workbook, args.performance, args.repo, args.change_ref)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({key: result[key] for key in ('periods', 'siteTotalsFromDailySeries', 'articleCohortsWithBaselineImpressions')}, indent=2))


if __name__ == '__main__':
    main()
