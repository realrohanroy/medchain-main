import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from tests.test_synthesize_api import test_synthesize_filters_ungranted_content

try:
    test_synthesize_filters_ungranted_content()
    print("SUCCESS: Synthesize test passed! Ungranted content was excluded.")
except AssertionError as e:
    print(f"FAILED: {e}")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"ERROR: {e}")
