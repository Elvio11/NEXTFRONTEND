import os

hands_dir = r"c:\Users\DELL\Antigravity\Talvix\TalvixAI Corp\server5\openfang\hands"

# Mapping of existing file names to their Dept ID
mapping = {
    "ceo_os.toml": 1,
    "marketing_director.toml": 4,
    "researcher.toml": 32, # Wait, researcher is Dept 32? Let me check Section 8
    "lead.toml": 15, # BD & Partnerships
    "collector.toml": 20, # QA Monitor?
    "predictor.toml": 13, # Conversion?
    "twitter.toml": 10, # Community?
    "browser.toml": 42, # Scraper?
    "clip.toml": 8, # Video & Reels?
    "content_writer.toml": 5,
    "data_analyst.toml": 24,
    "devops_monitor.toml": 21,
    "finance_ops.toml": 33,
    "retention_manager.toml": 14,
    "support_l1.toml": 28
}

# The names as sanitized in my code: 
# toml_name = name.lower().replace(" ", "_").replace("&", "and").replace("/", "_").replace("-", "_")

sanitized_names = {
    1: "commander_ceo_os",
    4: "marketing_director",
    5: "content_writer",
    8: "video_and_reels",
    10: "community_manager",
    13: "conversion_specialist",
    14: "retention_manager",
    15: "bd_and_partnerships",
    20: "qa_monitor",
    21: "devops___infra", # "DevOps / Infra" -> "devops___infra" due to replace(" ", "_") and replace("/", "_")
    24: "data_analyst",
    28: "customer_support_l1",
    32: "voice_of_customer",
    33: "finance_and_operations",
    42: "scraper_engineer"
}

for old_name, dept_id in mapping.items():
    if dept_id in sanitized_names:
        new_name = f"{dept_id:02d}_{sanitized_names[dept_id]}.toml"
        old_path = os.path.join(hands_dir, old_name)
        new_path = os.path.join(hands_dir, new_name)
        if os.path.exists(old_path):
            print(f"Renaming {old_name} -> {new_name}")
            os.rename(old_path, new_path)
