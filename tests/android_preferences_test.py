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

if __name__ == '__main__':
    unittest.main()
