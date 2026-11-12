#!/usr/bin/env python3
"""Compare basic SRT timing offline (Python 3.9+; standard library only).

Exit 0: counts and times match; 1: differ; 2: unsupported/invalid input.
No translation, video synchronization, readability or accessibility assessment.
Copyright 2026 Scanfile. SPDX-License-Identifier: MIT
"""
import argparse
import json
import re
from pathlib import Path

STAMP = r"(\d{2,}):([0-5]\d):([0-5]\d),(\d{3})"
TIMING = re.compile(STAMP + r" --> " + STAMP)
MAX_BYTES = 5 * 1024 * 1024


def milliseconds(parts):
    h, m, s, ms = map(int, parts)
    return ((h * 60 + m) * 60 + s) * 1000 + ms


def parse_srt(text):
    text = text.removeprefix('\ufeff').replace('\r\n', '\n').replace('\r', '\n').strip()
    if not text:
        raise ValueError('Empty SRT')
    cues = []
    for position, block in enumerate(re.split(r'\n[ \t]*\n+', text), 1):
        lines = block.split('\n')
        if len(lines) < 3 or not re.fullmatch(r'[0-9]+', lines[0].strip()):
            raise ValueError('Invalid cue structure at position %d' % position)
        match = TIMING.fullmatch(lines[1].strip())
        if not match or not any(line.strip() for line in lines[2:]):
            raise ValueError('Invalid timestamp or empty caption at position %d' % position)
        start, end = milliseconds(match.groups()[:4]), milliseconds(match.groups()[4:])
        if end <= start:
            raise ValueError('Non-positive duration at position %d' % position)
        cues.append((start, end))
    return cues


def compare(source, target):
    result = {'source_cues': len(source), 'target_cues': len(target),
              'comparison': 'cue position, not numeric cue identifier',
              'quality_assessed': False}
    if len(source) != len(target):
        return dict(result, status='count_mismatch', changed_positions=None)
    changed = [i for i, (a, b) in enumerate(zip(source, target), 1) if a != b]
    return dict(result, status='timing_mismatch' if changed else 'match', changed_positions=changed)


def read_srt(path):
    with Path(path).open('rb') as stream:
        data = stream.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError('File exceeds 5 MiB limit')
    return parse_srt(data.decode('utf-8-sig'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('translation')
    args = parser.parse_args()
    try:
        result = compare(read_srt(args.source), read_srt(args.translation))
    except (OSError, UnicodeError, ValueError) as error:
        print(json.dumps({'status': 'invalid_input', 'error': str(error)}))
        return 2
    print(json.dumps(result))
    return 0 if result['status'] == 'match' else 1


if __name__ == '__main__':
    raise SystemExit(main())
