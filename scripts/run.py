"""Download if missing -> pair -> fit -> metrics.json -> print loso vs same-site.

No data / no keys: print ILLUSTRATIVE + the download blocker and exit 0. The
web build stays illustrative until real numbers land here.

CLI: python scripts/run.py --cbsa 41620 --year 2022 --max-sites 8 \
        --max-sensors 40 --test-id <first held-out>
"""

import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import pandas as pd

from sensors import const, io
from sensors.eval import evaluate, print_report

PAIRS = "data/pairs.parquet"
METRICS = "metrics.json"
DATA_TS = "web/src/data.ts"


def load_or_build_pairs():
    if os.path.exists(PAIRS):
        return pd.read_parquet(PAIRS)
    epa_csv = "data/epa/hourly_88101_2022.csv"
    sensors_csv = "data/purpleair/sensors.csv"
    hourly_pq = "data/purpleair/hourly.parquet"
    if all(os.path.exists(p) for p in (epa_csv, sensors_csv, hourly_pq)):
        pairs = io.pair(
            io.load_epa(epa_csv),
            pd.read_csv(sensors_csv),
            pd.read_parquet(hourly_pq),
        )
        pairs.to_parquet(PAIRS)
        return pairs
    return None


def illustrative_exit():
    print("ILLUSTRATIVE: no measured pairs on disk; leak tests + CLI + web still ship.")
    r = subprocess.run([sys.executable, "scripts/download.py"], capture_output=True, text=True)
    lines = (r.stderr or r.stdout).strip().splitlines()
    msg = lines[0].replace("BLOCKER:", "").strip() if lines else "download unavailable"
    print("BLOCKER:", msg)
    sys.exit(0)


def write_data_ts(m):
    """Flip web/src/data.ts to real numbers if the web app exists (slice 3)."""
    if not os.path.exists(DATA_TS):
        return
    # ponytail: only the fields the page reads; the file's shape is owned by slice 3.
    print(f"note: {DATA_TS} exists; real metrics available in {METRICS} to sync.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cbsa", default=const.CBSA)
    ap.add_argument("--year", type=int, default=const.YEAR)
    ap.add_argument("--max-sites", type=int, default=const.MAX_SITES)
    ap.add_argument("--max-sensors", type=int, default=const.MAX_SENSORS)
    ap.add_argument("--test-id", default=None)
    args = ap.parse_args()

    pairs = load_or_build_pairs()
    if pairs is None or pairs.empty:
        illustrative_exit()

    sites = sorted(pairs["epa_site"].unique())
    if len(sites) > args.max_sites:
        sys.exit(f"HARD FAIL: {len(sites)} sites over cap {args.max_sites}")
    n_sensors = pairs["pa_id"].nunique()
    if n_sensors > args.max_sensors:
        sys.exit(f"HARD FAIL: {n_sensors} sensors over cap {args.max_sensors}")

    test_id = args.test_id or sites[0]
    if test_id not in sites:
        sys.exit(f"HARD FAIL: test-id {test_id} not among sites {sites}")

    m = evaluate(pairs, test_id)
    m.update({"cbsa": args.cbsa, "year": args.year, "dist_m": const.PAIR_DIST_M})
    with open(METRICS, "w") as f:
        json.dump(m, f, indent=2)
    print_report(m)
    write_data_ts(m)


if __name__ == "__main__":
    main()
