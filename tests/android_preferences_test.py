import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from android_preferences import preference_is_false

class AndroidPreferenceEncoding(unittest.TestCase):
    def test_text_false(self):
        self.assertTrue(preference_is_false('E: preference\n A: name="KeepRunning"\n A: value="false"', 'KeepRunning'))
    def test_compiled_boolean_false(self):
        self.assertTrue(preference_is_false('E: preference\n A: name="KeepRunning"\n A: value=(type 0x12)0x0', 'KeepRunning'))
    def test_true_is_rejected_even_if_raw_text_is_false(self):
        self.assertFalse(preference_is_false('E: preference\n A: name="KeepRunning"\n A: value=(type 0x12)0xffffffff (Raw: "false")', 'KeepRunning'))
    def test_missing_or_other_preference_is_rejected(self):
        self.assertFalse(preference_is_false('E: preference\n A: name="Other"\n A: value="false"', 'KeepRunning'))

    def test_replays_actual_namespaced_apk_dump(self):
        actual = '''N: =http://www.w3.org/ns/widgets
  N: cdv=http://cordova.apache.org/ns/1.0
    E: :widget (line=2)
      A: version="1.0.0" (Raw: "1.0.0")
      E: :access (line=3)
        A: origin="*" (Raw: "*")
      E: :preference (line=6)
        A: name="KeepRunning" (Raw: "KeepRunning")
        A: value=(type 0x12)0x0
'''
        for prefix in [':', 'cdv:', '']:
            with self.subTest(prefix=prefix):
                self.assertTrue(preference_is_false(actual.replace(':preference', prefix + 'preference'), 'KeepRunning'))
    def test_other_namespaced_false_does_not_hide_target_true(self):
        xml = 'E: :preference\n A: name="Other"\n A: value=(type 0x12)0x0\nE: :preference\n A: name="KeepRunning"\n A: value=(type 0x12)0xffffffff'
        self.assertFalse(preference_is_false(xml, 'KeepRunning'))

if __name__ == '__main__':
    unittest.main()
