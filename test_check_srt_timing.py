import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import check_srt_timing as checker

ROOT = Path(__file__).resolve().parent


class TimingTests(unittest.TestCase):
    def test_published_fixture_and_one_millisecond_difference(self):
        source = checker.read_srt(ROOT / 'workshop.en.srt')
        translated = checker.read_srt(ROOT / 'workshop.pt-BR.srt')
        self.assertEqual(checker.compare(source, translated)['status'], 'match')
        shifted = checker.read_srt(ROOT / 'workshop.pt-BR.shifted-1ms.srt')
        self.assertEqual(checker.compare(source, shifted)['changed_positions'], [3])
        changed = list(translated)
        changed[0] = (changed[0][0] + 1, changed[0][1])
        self.assertEqual(checker.compare(source, changed)['changed_positions'], [1])
        self.assertIsNone(checker.compare(source, changed[:-1])['changed_positions'])

    def test_cli_exit_codes(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source.srt'
            target = Path(directory) / 'target.srt'
            source.write_text('1\n00:00:01,000 --> 00:00:02,000\nHello\n', encoding='utf-8')
            for text, expected in [('1\n00:00:01,000 --> 00:00:02,000\nHi\n', 0),
                                   ('1\n00:00:01,001 --> 00:00:02,000\nHi\n', 1),
                                   ('WEBVTT\n', 2)]:
                target.write_text(text, encoding='utf-8')
                run = subprocess.run([sys.executable, str(ROOT / 'check_srt_timing.py'), str(source), str(target)],
                                     capture_output=True, text=True, check=False)
                self.assertEqual(run.returncode, expected)
                self.assertNotIn('Hello', run.stdout)
                self.assertNotIn('Hi', run.stdout)


if __name__ == '__main__':
    unittest.main()
