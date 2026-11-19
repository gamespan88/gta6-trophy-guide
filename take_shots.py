#!/usr/bin/env python3
"""Take the Leonida Trophy Guide's screenshots.

Serves app/ on a local port, opens each scene named in shots.json in headless
Chromium, waits for the app to signal it has rendered (window.__shotReady),
and writes JPEGs into screenshots/. The gate caps a screenshot at 256 KiB, a
1280 px long side and a 480 px short side, so captures start at quality 82
and step down until they fit.

Run with the airdrop-agent venv's Python (it has Playwright + Chromium):
    ~/workspace/airdrop-agent-v4/.venv/bin/python take_shots.py
"""

import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
APP_DIR = ROOT / "app"
SHOTS_DIR = ROOT / "screenshots"
MAX_BYTES = 262144  # 256 KiB
QUALITIES = (82, 74, 66, 58, 50)


def serve() -> ThreadingHTTPServer:
    handler = partial(SimpleHTTPRequestHandler, directory=str(APP_DIR))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def main() -> None:
    scenes = json.loads((ROOT / "shots.json").read_text())
    SHOTS_DIR.mkdir(exist_ok=True)
    server = serve()
    port = server.server_address[1]
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for scene in scenes:
                viewport = scene["viewport"]
                page = browser.new_page(viewport=viewport)
                url = f"http://127.0.0.1:{port}{scene['path']}"
                page.goto(url, wait_until="networkidle")
                page.wait_for_function("window.__shotReady === true")
                if scene.get("scroll"):
                    page.evaluate(f"window.scrollTo(0, {int(scene['scroll'])})")
                page.wait_for_timeout(250)
                target = SHOTS_DIR / scene["file"]
                for quality in QUALITIES:
                    page.screenshot(path=str(target), type="jpeg", quality=quality)
                    if target.stat().st_size <= MAX_BYTES:
                        break
                size = target.stat().st_size
                print(f"{scene['file']}: {size} bytes "
                      f"({viewport['width']}x{viewport['height']}, quality {quality})")
                if size > MAX_BYTES:
                    raise SystemExit(f"{scene['file']} is {size} bytes, over the 256 KiB cap")
                page.close()
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
