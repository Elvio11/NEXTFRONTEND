import sys
import os
import importlib.util

BASE_DIR = os.getcwd() # c:\Users\DELL\Antigravity\Talvix
S3_PATH = os.path.join(BASE_DIR, "branch-server3")
S2_PATH = os.path.join(BASE_DIR, "branch-server2")

sys.path.insert(0, S3_PATH)
sys.path.insert(0, S2_PATH)

print("Importing skills.storage_client...")
try:
    from skills import storage_client
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")

print("Importing agent9...")
try:
    import agents.agent9_scraper as agent9
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
    import traceback
    traceback.print_exc()

print("Importing agent6...")
try:
    # Need to merge first to avoid the prefilter_engine error
    from types import ModuleType
    if "skills" not in sys.modules:
        m = ModuleType("skills")
        m.__path__ = [os.path.join(S3_PATH, "skills"), os.path.join(S2_PATH, "skills")]
        sys.modules["skills"] = m
    
    import agents.agent6_fit as agent6
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
    import traceback
    traceback.print_exc()
