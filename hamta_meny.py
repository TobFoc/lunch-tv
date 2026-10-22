#!/usr/bin/env python3
"""Hämtar veckans lunchmeny från ICA Focus sida och sparar den som menu.json.

Kör: python3 hamta_meny.py [utfil]   (standard: menu.json)
Schemalägg t.ex. med cron varje morgon:
    0 6 * * 1-5  cd /sökväg/till/mappen && python3 hamta_meny.py
"""
import html
import json
import re
import sys
import urllib.request

URL = "https://www.ica.se/butiker/kvantum/goteborg/ica-focus-1004247/tjanster/lunch/"
DAGAR = ["måndag", "tisdag", "onsdag", "torsdag", "fredag"]


def hamta_html(url=URL):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (lunch-tv)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def till_rader(sida):
    sida = re.sub(r"(?is)<(script|style|noscript).*?</\1>", "", sida)
    sida = re.sub(r"(?i)<br\s*/?>|</(p|li|h[1-6]|div|section|tr|ul|ol)>", "\n", sida)
    sida = re.sub(r"(?s)<[^>]+>", "", sida)
    sida = html.unescape(sida).replace("\xa0", " ")
    return [re.sub(r"\s+", " ", r).strip() for r in sida.splitlines() if r.strip()]


def tolka(rader):
    meny = {"vecka": None, "lunchtid": None, "priser": [], "vegetariskt": None,
            "dagar": {d: [] for d in DAGAR}}
    aktuell = None
    for rad in rader:
        låg = rad.lower().rstrip(":")
        m = re.fullmatch(r"vecka (\d{1,2})", låg)
        if m and meny["vecka"] is None:
            meny["vecka"] = int(m.group(1))
            continue
        m = re.search(r"lunchen serveras från klockan (\d{1,2})[.:](\d{2}) till (\d{1,2})[.:](\d{2})", låg)
        if m:
            meny["lunchtid"] = {"start": f"{int(m.group(1)):02d}:{m.group(2)}",
                                "slut": f"{int(m.group(3)):02d}:{m.group(4)}"}
            continue
        if re.match(r"(dagens lunch|salladsbaren)\s+\d+\s*:-", låg):
            meny["priser"].append(rad)
            continue
        if låg.startswith("veckans vegetariska"):
            meny["vegetariskt"] = rad.split(":", 1)[1].strip() if ":" in rad else rad
            continue
        if låg in DAGAR:
            aktuell = låg
            continue
        if låg in ("lördag", "söndag"):
            aktuell = None
            continue
        if aktuell and not låg.startswith(("brunch", "serveras")):
            meny["dagar"][aktuell].append(rad)
    return meny


def main():
    ut = sys.argv[1] if len(sys.argv) > 1 else "menu.json"
    meny = tolka(till_rader(hamta_html()))
    if not any(meny["dagar"].values()):
        sys.exit("Hittade ingen meny på sidan – sparar inte (behåller gamla filen).")
    with open(ut, "w", encoding="utf-8") as f:
        json.dump(meny, f, ensure_ascii=False, indent=2)
    print(f"Sparade vecka {meny['vecka']} till {ut}")


if __name__ == "__main__":
    main()
