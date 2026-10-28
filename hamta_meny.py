#!/usr/bin/env python3
"""Hämtar veckans lunchmeny från ICA Focus sida och sparar den som menu.json.

Kör: python3 hamta_meny.py [utfil]   (standard: menu.json)
Skapar även en tom allergener.json när en ny vecka börjar (fylls i av köket).
Schemalägg t.ex. med cron varje morgon:
    0 6 * * 1-5  cd /sökväg/till/mappen && python3 hamta_meny.py
"""
import html
import json
import os
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


ALLERGENINFO = (
    "Fyll i allergener för varje rätt. Ersätt null med en lista, t.ex. [\"gluten\", \"laktos\"]. "
    "[] betyder att rätten inte innehåller några av de 14 allergenerna. null betyder att uppgift saknas "
    "och då visas 'fråga personalen'. Giltiga ord: gluten, laktos (mjölk), nötter, ägg, fisk, skaldjur, "
    "blötdjur, selleri, senap, soja, sesam, jordnötter, lupin, sulfit. Rättens namn måste stå exakt som på TV:n."
)


def ratt_namn(rad):
    """Samma uppdelning som index.html: namnet är texten före 'serveras', ett tankstreck eller 'med'."""
    for monster in (r"^(.*?)\s+serveras\s+", r"^(.*?)\s+[–-]\s+", r"^(.*?)\s+med\s+"):
        m = re.match(monster, rad, re.I)
        if m:
            return m.group(1).strip()
    return rad.strip()


def allergenmall(meny, sokvag):
    """Skapar en tom mall när en ny vecka börjar. Skriver aldrig över en fil för samma vecka
    och gissar aldrig några allergener: allt börjar som null (= fråga personalen)."""
    try:
        with open(sokvag, encoding="utf-8") as f:
            if json.load(f).get("vecka") == meny["vecka"]:
                return False
    except (OSError, ValueError):
        pass
    ny = {
        "_info": ALLERGENINFO,
        "vecka": meny["vecka"],
        "dagar": {d: {ratt_namn(r): None for r in rader} for d, rader in meny["dagar"].items()},
        "vegetariskt": None,
    }
    with open(sokvag, "w", encoding="utf-8") as f:
        json.dump(ny, f, ensure_ascii=False, indent=2)
    return True


def main():
    ut = sys.argv[1] if len(sys.argv) > 1 else "menu.json"
    meny = tolka(till_rader(hamta_html()))
    if not any(meny["dagar"].values()):
        sys.exit("Hittade ingen meny på sidan – sparar inte (behåller gamla filen).")
    with open(ut, "w", encoding="utf-8") as f:
        json.dump(meny, f, ensure_ascii=False, indent=2)
    print(f"Sparade vecka {meny['vecka']} till {ut}")
    mall = os.path.join(os.path.dirname(ut) or ".", "allergener.json")
    if allergenmall(meny, mall):
        print(f"Ny vecka: skapade tom allergenmall i {mall}. Fyll i den!")


if __name__ == "__main__":
    main()
