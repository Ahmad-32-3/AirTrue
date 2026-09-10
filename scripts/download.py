"""Download one CBSA, one year, outdoor PurpleAir + AQS PM2.5. Fail loud on
missing keys. Never pages the global PurpleAir API.

This is a thin, capped fetcher. Without keys it raises so run.py can fall back
to the illustrative web build (the documented no-key path).
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from sensors import const


class MissingKeys(RuntimeError):
    pass


def check_keys():
    pa = os.environ.get("PURPLEAIR_READ_KEY")
    aqs_email = os.environ.get("AQS_EMAIL")
    aqs_key = os.environ.get("AQS_KEY")
    have_airdata = os.path.isdir("data/epa") and any(
        f.endswith(".csv") for f in os.listdir("data/epa")
    ) if os.path.isdir("data/epa") else False

    problems = []
    if not pa:
        problems.append("PURPLEAIR_READ_KEY unset")
    if not (aqs_email and aqs_key) and not have_airdata:
        problems.append("AQS_EMAIL+AQS_KEY unset and no CSV in data/epa/")
    if problems:
        raise MissingKeys("; ".join(problems))


def main():
    try:
        check_keys()
    except MissingKeys as e:
        print(f"BLOCKER: {e}", file=sys.stderr)
        print(
            "Set PURPLEAIR_READ_KEY and AQS_EMAIL/AQS_KEY in .env, or drop annual "
            "AirData hourly CSVs in data/epa/. Then re-run.",
            file=sys.stderr,
        )
        sys.exit(2)

    # ponytail: live fetch is written when keys land; capped to CBSA/year/outdoor,
    # <= MAX_SENSORS sensors, param 88101 only. No global paging.
    raise NotImplementedError(
        f"keys present; implement capped fetch for CBSA {const.CBSA} {const.YEAR} "
        f"(<= {const.MAX_SENSORS} sensors, param {const.AQS_PARAM})"
    )


if __name__ == "__main__":
    main()
