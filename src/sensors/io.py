# Load EPA + PurpleAir, QC the laser channels, pair by distance.
# Functions only. File loaders fail loud on a missing column; the QC and
# pairing math is the testable core (see tests/test_eval.py).

import math

import numpy as np
import pandas as pd

from . import const


def haversine_m(lat1, lon1, lat2, lon2):
    """Great-circle distance in metres. Scalar or numpy-broadcastable."""
    r = 6_371_000.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp = np.radians(lat2 - lat1)
    dl = np.radians(lon2 - lon1)
    a = np.sin(dp / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return 2 * r * np.arcsin(np.sqrt(a))


def _require(df, cols, what):
    missing = [c for c in cols if c not in df.columns]
    if missing:
        raise ValueError(f"{what}: missing column(s) {missing}; have {list(df.columns)}")


def load_epa(path):
    """AirData/AQS hourly 88101 CSV -> ts, epa_site, epa_pm25, lat, lon.

    Accepts either the already-normalised columns or the raw AirData header.
    """
    df = pd.read_csv(path)
    if {"ts", "epa_site", "epa_pm25", "lat", "lon"}.issubset(df.columns):
        out = df[["ts", "epa_site", "epa_pm25", "lat", "lon"]].copy()
    else:
        _require(
            df,
            ["State Code", "County Code", "Site Num", "Date GMT", "Time GMT",
             "Sample Measurement", "Latitude", "Longitude"],
            "load_epa (raw AirData)",
        )
        site = (
            df["State Code"].astype(str).str.zfill(2)
            + df["County Code"].astype(str).str.zfill(3)
            + df["Site Num"].astype(str).str.zfill(4)
        )
        out = pd.DataFrame(
            {
                "ts": pd.to_datetime(df["Date GMT"] + " " + df["Time GMT"], utc=True),
                "epa_site": site,
                "epa_pm25": df["Sample Measurement"],
                "lat": df["Latitude"],
                "lon": df["Longitude"],
            }
        )
    out["ts"] = pd.to_datetime(out["ts"], utc=True)
    return out.dropna(subset=["epa_pm25"])


def qc_pa(hourly):
    """Average PA channels A/B at CF=1; drop an hour if a channel is NaN or the
    two channels disagree by more than QC_AB_REL. Returns ts, sensor_index,
    pa_cf1, rh."""
    _require(hourly, ["sensor_index", "ts", "pm25_cf1_a", "pm25_cf1_b", "rh"], "qc_pa")
    df = hourly.copy()
    a, b = df["pm25_cf1_a"], df["pm25_cf1_b"]
    mean = (a + b) / 2
    rel = (a - b).abs() / mean.replace(0, np.nan)
    keep = a.notna() & b.notna() & df["rh"].notna() & (rel <= const.QC_AB_REL)
    df = df[keep].copy()
    df["pa_cf1"] = (df["pm25_cf1_a"] + df["pm25_cf1_b"]) / 2
    df["ts"] = pd.to_datetime(df["ts"], utc=True)
    return df[["ts", "sensor_index", "pa_cf1", "rh"]]


def pair(epa, sensors, pa_hourly, dist_m=const.PAIR_DIST_M):
    """Join each outdoor PA sensor to every AQS site within dist_m, then match
    hours. Returns the pairs contract: ts, epa_site, pa_id, epa_pm25, pa_cf1,
    rh, dist_m. No fill across sites."""
    _require(sensors, ["sensor_index", "lat", "lon", "outdoor"], "pair (sensors)")
    site_ll = epa[["epa_site", "lat", "lon"]].drop_duplicates("epa_site")
    outdoor = sensors[sensors["outdoor"].astype(bool)]

    links = []
    for s in outdoor.itertuples():
        d = haversine_m(s.lat, s.lon, site_ll["lat"].to_numpy(), site_ll["lon"].to_numpy())
        near = site_ll.assign(dist_m=d)
        near = near[near["dist_m"] <= dist_m]
        for site in near.itertuples():
            links.append((s.sensor_index, site.epa_site, site.dist_m))
    if not links:
        return pd.DataFrame(columns=["ts", "epa_site", "pa_id", "epa_pm25", "pa_cf1", "rh", "dist_m"])

    link = pd.DataFrame(links, columns=["sensor_index", "epa_site", "dist_m"])
    pa = qc_pa(pa_hourly).merge(link, on="sensor_index")
    epa_h = epa[["ts", "epa_site", "epa_pm25"]]
    out = pa.merge(epa_h, on=["ts", "epa_site"])
    out = out.rename(columns={"sensor_index": "pa_id"})
    return out[["ts", "epa_site", "pa_id", "epa_pm25", "pa_cf1", "rh", "dist_m"]].dropna(
        subset=["epa_pm25", "pa_cf1", "rh"]
    )
