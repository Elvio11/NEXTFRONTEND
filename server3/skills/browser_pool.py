"""
skills/browser_pool.py
Manages undetected-chromedriver instances for Server 3 (Automation Layer).

Rules:
  - headless=False for LinkedIn (critical for session stability and anti-ban)
  - headless=False for all apply operations (consistent behaviour)
  - driver.quit() ALWAYS in finally — never rely on GC
  - Randomised viewport to vary fingerprint per instance
  - context manager pattern ensures cleanup on exception

Usage:
    async with browser_context(headless=False) as driver:
        driver.get("https://...")
        # driver.quit() called automatically in __aexit__ finally
"""

import random
from contextlib import asynccontextmanager

import undetected_chromedriver as uc
from selenium.webdriver.chrome.options import Options


# ─── Viewport Pool ─────────────────────────────────────────────────────────────
_VIEWPORTS = [
    (1366, 768),
    (1440, 900),
    (1920, 1080),
    (1280, 800),
    (1600, 900),
]


def get_driver(headless: bool = False) -> uc.Chrome:
    """
    Create and return a configured undetected-chromedriver instance.

    headless MUST be False for LinkedIn sessions — True causes immediate
    session invalidation and ban risk.

    Always call release_driver(driver) in a finally block.
    """
    options = uc.ChromeOptions()

    if headless:
        # Only allow headless for non-LinkedIn non-apply operations
        options.add_argument("--headless=new")

    # Randomise viewport for each session
    width, height = random.choice(_VIEWPORTS)
    options.add_argument(f"--window-size={width},{height}")

    # Required for server environments (no display)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")

    # Timezone — consistent India TZ
    options.add_argument("--lang=en-IN")

    driver = uc.Chrome(options=options, use_subprocess=True)
    driver.set_page_load_timeout(30)
    driver.implicitly_wait(0)  # Never use implicit wait — use WebDriverWait explicitly

    return driver


def release_driver(driver: uc.Chrome) -> None:
    """
    Safely quit the driver. Always call this in a finally block.
    If driver.quit() raises, log and continue — don't let cleanup exceptions propagate.
    """
    try:
        driver.quit()
    except Exception as exc:
        print(f"[browser_pool] driver.quit() error (non-critical): {exc}")


@asynccontextmanager
async def browser_context(headless: bool = False):
    """
    Async context manager for a browser session.

    Usage:
        async with browser_context() as driver:
            driver.get("https://...")
            # driver.quit() called in finally — even on exception

    headless=False is the default and should stay False for LinkedIn/apply.
    """
    driver = None
    try:
        driver = get_driver(headless=headless)
        yield driver
    finally:
        if driver is not None:
            release_driver(driver)
