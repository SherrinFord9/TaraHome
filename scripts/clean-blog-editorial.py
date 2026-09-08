#!/usr/bin/env python3
"""One-time removal of internal topic-selection sections; preserve article markup."""

import argparse
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


def clean(html):
    soup = BeautifulSoup(html, 'html.parser')
    body = soup.select_one('.article-body')
    if not body:
        return html, []
    offsets = [0]
    for line in html.splitlines(keepends=True):
        offsets.append(offsets[-1] + len(line))

    def start(tag):
        return offsets[tag.sourceline - 1] + tag.sourcepos

    edits = []
    headings = body.select('h2')
    for index, heading in enumerate(headings):
        text = heading.get_text(' ', strip=True)
        if not re.search(r'^Why (?:This Question|People Are Asking|Homeowners Are Asking|This Is .*Question|This Keeps Coming Up)', text, re.I):
            continue
        first = start(heading)
        if index + 1 >= len(headings):
            raise ValueError('Unexpected final research heading: ' + text)
        last = start(headings[index + 1])
        # Retain old fragment targets without leaving a research heading on screen.
        anchor = '<span id="' + heading['id'] + '"></span>\n' if heading.get('id') else ''
        edits.append((first, last, anchor, text))
    for first, last, replacement, _ in reversed(edits):
        html = html[:first] + replacement + html[last:]
    return html, [edit[3] for edit in edits]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    changes = []
    for file in sorted((root / 'blog').glob('*/index.html')):
        original = file.read_text()
        updated, sections = clean(original)
        if updated != original:
            changes.append({'article': str(file.relative_to(root)), 'removedInternalSections': sections})
            if args.apply:
                file.write_text(updated)
    print(json.dumps(changes, indent=2))
    print(f'{len(changes)} articles {"cleaned" if args.apply else "would change"}.')


if __name__ == '__main__':
    main()
