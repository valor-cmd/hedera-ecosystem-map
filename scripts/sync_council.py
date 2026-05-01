#!/usr/bin/env python3
"""
Hedera Council Sync Script
--------------------------
Scrapes hederacouncil.org for current council members, downloads logos,
converts them to white, and updates the ecosystem map (index.html + CSV).

Features:
  - Detects new members not yet on the map
  - Downloads SVG/PNG logos from hederacouncil.org
  - Converts SVG logos to white fills for dark backgrounds
  - Adds new members to the council section in index.html (normal + hover grids)
  - Recalculates spacing so all logos fit evenly
  - Updates the master CSV
  - Each logo links to the member's website

Usage:
  python3 scripts/sync_council.py              # dry-run: show what would change
  python3 scripts/sync_council.py --apply      # apply changes to index.html + CSV
  python3 scripts/sync_council.py --apply --commit  # also git commit + push
"""

import argparse
import base64
import csv
import math
import os
import re
import subprocess
import sys
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_HTML = os.path.join(ROOT, "index.html")
CSV_PATH = os.path.join(ROOT, "data", "hedera_ecosystem_master.csv")
LOGOS_DIR = os.path.join(ROOT, "logos", "council")

HEDERACOUNCIL_URL = "https://hederacouncil.org"

COUNCIL_NORMAL_COLS = 2
COUNCIL_NORMAL_PANEL = {"x": 1342, "y": 110, "w": 320, "h": 885}
COUNCIL_HOVER_COLS = 5

WEBSITE_MAP = {
    "Aberdeen": "https://abrdn.com",
    "abrdn": "https://abrdn.com",
    "Accenture": "https://accenture.com",
    "Arrow": "https://arrow.com",
    "Australian Payments Plus": "https://www.auspayplus.com.au",
    "Avery Dennison": "https://averydennison.com",
    "BitGo": "https://bitgo.com",
    "Blockchain For Energy": "https://blockchainforenergy.net",
    "Blockchain for Energy": "https://blockchainforenergy.net",
    "Chainlink Labs": "https://chainlinklabs.com",
    "COFRA": "https://cofraholding.com",
    "Cofra": "https://cofraholding.com",
    "Dell": "https://dell.com",
    "Dentons": "https://dentons.com",
    "Deutsche Telekom": "https://telekom.com",
    "DLA Piper": "https://dlapiper.com",
    "EDF": "https://edf.fr",
    "FedEx": "https://fedex.com",
    "Google": "https://google.com",
    "Hitachi": "https://hitachi.com",
    "IBM": "https://ibm.com",
    "IIT Madras": "https://www.iitm.ac.in",
    "LG": "https://lg.com",
    "LG Electronics": "https://lg.com",
    "LSE": "https://lse.ac.uk",
    "Magalu": "https://magazineluiza.com.br",
    "McLaren Racing": "https://www.mclaren.com",
    "Mondelez": "https://mondelezinternational.com",
    "Mondelēz": "https://mondelezinternational.com",
    "NSE": "https://nse.co.ke",
    "Nairobi Securities Exchange": "https://nse.co.ke",
    "Nomura": "https://nomura.com",
    "Repsol": "https://repsol.com",
    "ServiceNow": "https://servicenow.com",
    "Shinhan Bank": "https://www.shinhan.com",
    "Standard Bank": "https://standardbank.com",
    "Swirlds": "https://swirldslabs.com",
    "Swirlds Labs": "https://swirldslabs.com",
    "Tata Communications": "https://tatacommunications.com",
    "Ubisoft": "https://ubisoft.com",
    "Wipro": "https://wipro.com",
    "Zain": "https://zain.com",
    "Zain Group": "https://zain.com",
}

NAME_NORMALIZATION = {
    "Aberdeen": "abrdn",
    "COFRA": "Cofra",
    "Blockchain For Energy": "Blockchain for Energy",
    "Mondelēz": "Mondelez",
    "LG": "LG Electronics",
    "NSE": "Nairobi Securities Exchange",
    "Swirlds": "Swirlds Labs",
    "Zain": "Zain Group",
}


def fetch_page(url):
    req = urllib.request.Request(url, headers={"User-Agent": "HederaMapSync/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def scrape_council_members():
    html = fetch_page(HEDERACOUNCIL_URL)
    members = []
    for m in re.finditer(
        r'<button[^>]*class="[^"]*svelte-[^"]*"[^>]*>(.*?)</button>',
        html,
        re.DOTALL,
    ):
        btn = m.group(1)
        imgs = re.findall(r'<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"', btn)
        if not imgs:
            continue
        white = [s for s, a in imgs if "white" in s.lower()]
        black = [s for s, a in imgs if "black" in s.lower() or "dark" in s.lower()]
        regular = [s for s, a in imgs if "white" not in s.lower() and "black" not in s.lower() and "dark" not in s.lower()]
        logo_url = white[0] if white else (black[0] if black else (regular[0] if regular else imgs[0][0]))
        alt = imgs[0][1]
        name = alt.replace(" logo", "").strip()
        members.append({"name": name, "logo_url": logo_url, "all_imgs": imgs})
    return members


def download_logo(logo_url, dest_path):
    full_url = logo_url if logo_url.startswith("http") else HEDERACOUNCIL_URL + logo_url
    req = urllib.request.Request(full_url, headers={"User-Agent": "HederaMapSync/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    with open(dest_path, "wb") as f:
        f.write(data)
    return data


def make_svg_white(svg_content):
    if isinstance(svg_content, bytes):
        svg_content = svg_content.decode("utf-8", errors="replace")
    svg_content = re.sub(r'fill="(?:black|#000000|#000)"', 'fill="#fff"', svg_content)
    svg_content = re.sub(r'fill\s*:\s*(?:black|#000000|#000)\s*;', 'fill:#fff;', svg_content)
    svg_content = re.sub(r'fill\s*:\s*(?:black|#000000|#000)([;\s}])', r'fill:#fff\1', svg_content)
    svg_content = re.sub(r'fill="(?:#[0-9a-fA-F]{3,6})"', 'fill="#fff"', svg_content)
    svg_content = re.sub(r'fill\s*:\s*#[0-9a-fA-F]{3,6}', 'fill:#fff', svg_content)
    if not re.search(r'fill\s*[:=]', svg_content):
        svg_content = svg_content.replace("<svg", '<svg fill="white"', 1)
    return svg_content


def svg_to_white_data_uri(svg_path):
    with open(svg_path, "r") as f:
        svg = f.read()
    white_svg = make_svg_white(svg)
    b64 = base64.b64encode(white_svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"


def png_to_data_uri(png_path):
    with open(png_path, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode("ascii")
    ext = os.path.splitext(png_path)[1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}.get(ext.lstrip("."), "image/png")
    return f"data:{mime};base64,{b64}"


def logo_to_data_uri(logo_path):
    ext = os.path.splitext(logo_path)[1].lower()
    if ext == ".svg":
        return svg_to_white_data_uri(logo_path)
    return png_to_data_uri(logo_path)


def get_existing_council_from_html(content):
    names = set()
    section_idx = content.find('data-section="Hedera Council"')
    if section_idx < 0:
        return names
    normal_idx = content.find('class="council-normal"', section_idx)
    if normal_idx < 0:
        return names
    hover_idx = content.find('class="council-hover"', normal_idx)
    end_idx = hover_idx if hover_idx > 0 else normal_idx + 200000
    region = content[normal_idx:end_idx]
    for m in re.finditer(r'href="([^"]+)"[^>]*class="logo-link"', region):
        names.add(m.group(1))
    return names


def get_existing_council_from_csv():
    members = {}
    with open(CSV_PATH, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Section") == "Hedera Council":
                members[row["Entity"]] = row
    return members


def normalize_name(scraped_name):
    return NAME_NORMALIZATION.get(scraped_name, scraped_name)


def get_website(name):
    return WEBSITE_MAP.get(name, f"https://{name.lower().replace(' ', '')}.com")


LOGO_FILE_MAP = {
    "abrdn": "aberdeen-black.svg",
    "LG Electronics": "lg-black.svg",
    "Nairobi Securities Exchange": "nse-black.svg",
    "ServiceNow": "service-now-black.svg",
    "Swirlds Labs": "swirlds-black.svg",
    "Tata Communications": "tata-black.svg",
    "Zain Group": "zain-black.svg",
    "Cofra": "cofra-black.svg",
    "Mondelez": "mondelez-black.svg",
    "Blockchain for Energy": "blockchain-for-energy.svg",
    "FedEx": "fedex.svg",
    "Repsol": "repsol-logo-white-flat.png",
    "McLaren Racing": "mclaren-racing-black.svg",
    "IIT Madras": "iit-madras-black.svg",
    "DLA Piper": "dla-piper-black.svg",
    "Deutsche Telekom": "deutsche-telekom-black.svg",
    "Shinhan Bank": "shinhan-bank-black.svg",
    "Standard Bank": "standard-bank-black.svg",
    "Australian Payments Plus": "australian-payments-plus-black.svg",
    "Avery Dennison": "avery-dennison-black.svg",
    "Chainlink Labs": "chainlink-labs-black.svg",
}


def find_local_logo(name):
    if name in LOGO_FILE_MAP:
        p = os.path.join(LOGOS_DIR, LOGO_FILE_MAP[name])
        if os.path.exists(p):
            return p
    slug = name.lower().replace(" ", "-").replace("'", "").replace(".", "")
    candidates = [
        os.path.join(LOGOS_DIR, f"{slug}-black.svg"),
        os.path.join(LOGOS_DIR, f"{slug}.svg"),
        os.path.join(LOGOS_DIR, f"{slug}-black.png"),
        os.path.join(LOGOS_DIR, f"{slug}.png"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    for f in os.listdir(LOGOS_DIR):
        if os.path.isfile(os.path.join(LOGOS_DIR, f)) and slug in f.lower():
            return os.path.join(LOGOS_DIR, f)
    return None


def compute_grid_positions(count, cols, panel):
    pad_x = 8
    pad_y = 50
    cell_w = (panel["w"] - 2 * pad_x) / cols
    cell_h = 60
    rows_needed = math.ceil(count / cols)
    total_grid_h = rows_needed * cell_h
    available_h = panel["h"] - pad_y
    if total_grid_h > available_h:
        cell_h = available_h / rows_needed
    logo_w = cell_w * 0.8
    logo_h = cell_h * 0.55
    positions = []
    for i in range(count):
        row = i // cols
        col = i % cols
        cx = panel["x"] + pad_x + col * cell_w + cell_w / 2
        cy = panel["y"] + pad_y + row * cell_h + cell_h / 2
        x = cx - logo_w / 2
        y = cy - logo_h / 2
        positions.append({"x": x, "y": y, "w": logo_w, "h": logo_h})
    return positions


def compute_hover_positions(count, cols=7):
    pad = 30
    logo_w = 100
    logo_h = 60
    gap_x = 15
    gap_y = 10
    rows = math.ceil(count / cols)
    total_w = cols * logo_w + (cols - 1) * gap_x
    total_h = rows * logo_h + (rows - 1) * gap_y
    start_x = 1662 - total_w / 2
    start_y = 552.5 - total_h / 2
    positions = []
    for i in range(count):
        row = i // cols
        col = i % cols
        x = start_x + col * (logo_w + gap_x)
        y = start_y + row * (logo_h + gap_y)
        positions.append({"x": x, "y": y, "w": logo_w, "h": logo_h})
    panel_x = start_x - pad
    panel_y = start_y - 40
    panel_w = total_w + 2 * pad
    panel_h = total_h + pad + 40
    return positions, {"x": panel_x, "y": panel_y, "w": panel_w, "h": panel_h}


def build_entry_html(name, website, data_uri, pos, css_class="council-logo-image"):
    return (
        f'<a href="{website}" target="_blank" class="logo-link">'
        f'<image class="{css_class}" '
        f'x="{pos["x"]:.2f}" y="{pos["y"]:.2f}" '
        f'width="{pos["w"]:.2f}" height="{pos["h"]:.2f}" '
        f'href="{data_uri}" '
        f'preserveAspectRatio="xMidYMid meet" style="pointer-events: none;">'
        f"</image></a>"
    )


def rebuild_council_section(content, members_data):
    sorted_members = sorted(members_data, key=lambda m: m["name"].lower())
    count = len(sorted_members)

    normal_positions = compute_grid_positions(count, COUNCIL_NORMAL_COLS, COUNCIL_NORMAL_PANEL)
    hover_positions, hover_panel = compute_hover_positions(count, COUNCIL_HOVER_COLS)

    normal_entries = []
    for i, member in enumerate(sorted_members):
        normal_entries.append(build_entry_html(
            member["name"], member["website"], member["data_uri"], normal_positions[i]
        ))

    hover_entries = []
    for i, member in enumerate(sorted_members):
        hover_entries.append(build_entry_html(
            member["name"], member["website"], member["data_uri"], hover_positions[i]
        ))

    normal_panel_html = (
        f'<rect class="panel" x="{COUNCIL_NORMAL_PANEL["x"]}" y="{COUNCIL_NORMAL_PANEL["y"]}" '
        f'width="{COUNCIL_NORMAL_PANEL["w"]}" height="{COUNCIL_NORMAL_PANEL["h"]}" rx="12"></rect>'
    )
    normal_html = (
        f'<g class="council-normal">{normal_panel_html}'
        + "".join(normal_entries)
        + "</g>"
    )

    scale_ratio = COUNCIL_NORMAL_PANEL["w"] / (hover_panel["w"])
    origin_x = COUNCIL_NORMAL_PANEL["x"] + COUNCIL_NORMAL_PANEL["w"] / 2
    origin_y = COUNCIL_NORMAL_PANEL["y"] + COUNCIL_NORMAL_PANEL["h"] / 2

    hover_panel_html = (
        f'<rect class="panel" x="{hover_panel["x"]:.0f}" y="{hover_panel["y"]:.0f}" '
        f'width="{hover_panel["w"]:.0f}" height="{hover_panel["h"]:.0f}" rx="12"></rect>'
    )
    hover_html = (
        f'<g class="council-hover" data-scale-ratio="{scale_ratio:.3f}" '
        f'style="transform: scale({scale_ratio}); transform-origin: {origin_x:.0f}px {origin_y:.0f}px;">'
        f"{hover_panel_html}"
        + "".join(hover_entries)
        + "</g>"
    )

    normal_start = content.find('<g class="council-normal">')
    if normal_start < 0:
        print("ERROR: Could not find council-normal group")
        return content
    normal_end = content.find("</g>", normal_start)
    if normal_end < 0:
        print("ERROR: Could not find council-normal closing tag")
        return content
    normal_end += 4

    hover_start = content.find('<g class="council-hover"', normal_end)
    if hover_start < 0:
        print("ERROR: Could not find council-hover group")
        return content
    hover_end = content.find("</g>", hover_start)
    if hover_end < 0:
        print("ERROR: Could not find council-hover closing tag")
        return content
    hover_end += 4

    content = content[:normal_start] + normal_html + content[normal_end:hover_start] + hover_html + content[hover_end:]

    return content


def update_csv(members_data):
    existing = {}
    rows = []
    with open(CSV_PATH, "r") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)
            if row.get("Section") == "Hedera Council":
                existing[row["Entity"]] = True

    new_rows = []
    for member in members_data:
        if member["name"] not in existing:
            new_rows.append({
                "Entity": member["name"],
                "Section": "Hedera Council",
                "Type_or_Role": "Council Member",
                "Tier": "Tier 1",
                "Status": "Active",
                "Primary_Source": "hederacouncil.org",
                "Website": member["website"],
            })

    if new_rows:
        rows.extend(new_rows)
        with open(CSV_PATH, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    return new_rows


def main():
    parser = argparse.ArgumentParser(description="Sync Hedera Council members from hederacouncil.org")
    parser.add_argument("--apply", action="store_true", help="Apply changes to index.html and CSV")
    parser.add_argument("--commit", action="store_true", help="Git commit and push after applying")
    args = parser.parse_args()

    print("Scraping hederacouncil.org...")
    scraped = scrape_council_members()
    print(f"Found {len(scraped)} members on hederacouncil.org")

    csv_members = get_existing_council_from_csv()
    print(f"Found {len(csv_members)} members in CSV")

    members_data = []
    new_members = []

    for s in scraped:
        name = normalize_name(s["name"])
        website = get_website(name)
        logo_path = find_local_logo(name)

        if not logo_path:
            if not args.apply:
                print(f"  NEW: {name} (logo not found locally, would download)")
                new_members.append(name)
                continue
            print(f"  Downloading logo for {name}...")
            logo_url = s["logo_url"]
            ext = os.path.splitext(logo_url)[1] or ".svg"
            slug = name.lower().replace(" ", "-").replace("'", "").replace(".", "")
            dest = os.path.join(LOGOS_DIR, f"{slug}-black{ext}")
            try:
                download_logo(logo_url, dest)
                logo_path = dest
                print(f"    Saved to {dest}")
            except Exception as e:
                print(f"    ERROR downloading: {e}")
                continue

        data_uri = logo_to_data_uri(logo_path)
        members_data.append({"name": name, "website": website, "data_uri": data_uri, "logo_path": logo_path})

        if name not in csv_members:
            new_members.append(name)

    print(f"\nTotal members to render: {len(members_data)}")
    if new_members:
        print(f"New members: {', '.join(new_members)}")
    else:
        print("No new members detected.")

    if not args.apply:
        print("\nDry run complete. Use --apply to make changes.")
        return

    print("\nRebuilding council section in index.html...")
    with open(INDEX_HTML, "r") as f:
        content = f.read()

    content = rebuild_council_section(content, members_data)

    with open(INDEX_HTML, "w") as f:
        f.write(content)
    print("index.html updated.")

    new_csv_rows = update_csv(members_data)
    if new_csv_rows:
        print(f"Added {len(new_csv_rows)} new rows to CSV.")
    else:
        print("CSV already up to date.")

    if args.commit and new_members:
        print("\nCommitting and pushing...")
        subprocess.run(["git", "add", INDEX_HTML, CSV_PATH, LOGOS_DIR], cwd=ROOT)
        msg = f"Sync council: add {', '.join(new_members)}"
        subprocess.run(
            ["git", "commit", "-m", msg + "\n\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude <noreply@anthropic.com>"],
            cwd=ROOT,
        )
        subprocess.run(["git", "push", "origin", "main"], cwd=ROOT)
        print("Pushed to origin/main.")
    elif args.commit:
        print("No new members, nothing to commit.")

    print("\nDone!")


if __name__ == "__main__":
    main()
