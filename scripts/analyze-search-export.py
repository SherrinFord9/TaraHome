#!/usr/bin/env python3
"""Import a Search Console workbook without confusing query rows with site totals."""

import argparse
import csv
import json
from datetime import date, datetime, timedelta
from pathlib import Path

import openpyxl
from openpyxl.utils.datetime import from_excel


def summarize(rows):
    impressions = sum(row['impressions'] for row in rows)
    clicks = sum(row['clicks'] for row in rows)
    return {
        'start': rows[0]['date'], 'end': rows[-1]['date'], 'days': len(rows),
        'clicks': clicks, 'impressions': impressions,
        'ctrPercent': round(100 * clicks / impressions, 3) if impressions else 0,
        'approximatePosition': round(sum(row['position'] * row['impressions'] for row in rows) / impressions, 2) if impressions else 0,
    }


def analyze(source, export_date):
    workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
    tables = {sheet.title: list(sheet.values) for sheet in workbook}
    workbook.close()
    if 'Chart' not in tables:
        raise ValueError('A daily Chart sheet is required for date comparisons; query totals are incomplete.')
    chart = []
    for day, clicks, impressions, ctr, position in tables['Chart'][1:]:
        if not isinstance(day, (datetime, date)):
            day = from_excel(day) if isinstance(day, (int, float)) else date.fromisoformat(day)
        chart.append(dict(date=day.strftime('%Y-%m-%d'), clicks=int(clicks), impressions=int(impressions), position=float(position)))
    chart.sort(key=lambda row: row['date'])
    for previous, current in zip(chart, chart[1:]):
        if date.fromisoformat(current['date']) - date.fromisoformat(previous['date']) != timedelta(days=1):
            raise ValueError('Chart has missing or duplicate dates; refusing a misleading rolling comparison.')
    if len(chart) < 56:
        raise ValueError('At least 56 daily rows are needed for two complete 28-day windows.')
    current, previous = summarize(chart[-28:]), summarize(chart[-56:-28])
    weekly = [summarize(chart[index:index + 7]) for index in range(len(chart) % 7, len(chart), 7)]
    changes = []
    for index in range(7, len(chart) - 6):
        before, after = summarize(chart[index - 7:index]), summarize(chart[index:index + 7])
        if before['impressions'] >= 500:
            changes.append({'date': chart[index]['date'], 'before': before, 'after': after,
                            'impressionsChangePercent': round((after['impressions'] / before['impressions'] - 1) * 100, 2)})
    dimensions = {}
    for name in ('Queries', 'Pages', 'Countries', 'Devices'):
        table = tables.get(name, [])
        dimensions[name.lower()] = [dict(zip(table[0], row)) for row in table[1:]] if table else []
    return {
        'exportDate': export_date, 'sourceFile': source.name,
        'report': 'Google Search Console Web, last 3 months; daily series through ' + chart[-1]['date'],
        'measurementNotes': [
            'Site totals and rolling comparisons use Chart, not the incomplete Queries table.',
            'Pages, Queries, Countries and Devices are cumulative for the entire exported period. They cannot identify recent page-level losses.',
            'Position is an impression-weighted approximation from rounded daily averages. Query mix can change it; improved average position does not prove demand fell.',
            'A URL absent from the Pages table has no reported impressions in this export; that alone does not prove it is unindexed.',
        ],
        'fullPeriod': summarize(chart),
        'last28Days': current, 'previous28Days': previous,
        'change': {key + 'Percent': round((current[key] / previous[key] - 1) * 100, 2) if previous[key] else None for key in ('clicks', 'impressions')},
        'last7Days': summarize(chart[-7:]), 'previous7Days': summarize(chart[-14:-7]),
        'largestSevenDayBreak': min(changes, key=lambda row: row['impressionsChangePercent'], default=None),
        'weekly': weekly, 'daily': chart, 'dimensionsFullPeriod': dimensions,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('--date', required=True)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    date.fromisoformat(args.date)
    result = analyze(args.workbook, args.date)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    daily_path = args.output.with_name('search-daily-' + args.date + '.csv')
    with daily_path.open('w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=['date', 'clicks', 'impressions', 'position'], lineterminator='\n')
        writer.writeheader()
        writer.writerows(result['daily'])
    print(json.dumps({key: result[key] for key in ('last28Days', 'previous28Days', 'change', 'largestSevenDayBreak')}, indent=2))


if __name__ == '__main__':
    main()
