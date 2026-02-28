import os, glob

root = r"c:\Users\DELL\Antigravity\Talvix\server2"
for pyfile in glob.glob(root + "/**/*.py", recursive=True):
    with open(pyfile, "r", encoding="utf-8") as f:
        content = f.read()
    if "log_utils.agent_logger" in content:
        new = content.replace("log_utils.agent_logger", "log_utils.agent_logger")
        with open(pyfile, "w", encoding="utf-8") as f:
            f.write(new)
        print("Fixed:", pyfile)
