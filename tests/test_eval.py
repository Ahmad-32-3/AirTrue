import numpy as np
import pandas as pd
import pytest

from sensors.ablate import ablation
from sensors.eval import evaluate, metrics
from sensors.io import qc_pa
from sensors.split import check_no_leak, loso_split


def synthetic_pairs(n_sites=4, per_site=200, seed=0):
    """Pairs where EPA is a known linear function of pa_cf1 and rh plus a
    per-site offset, so loso is a real transfer test, not a lookup."""
    rng = np.random.default_rng(seed)
    rows = []
    for s in range(n_sites):
        pa = rng.uniform(2, 60, per_site)
        rh = rng.uniform(20, 90, per_site)
        offset = 1.5 * s  # each site sits a little differently
        epa = 0.5 * pa - 0.08 * rh + 5.0 + offset + rng.normal(0, 1.0, per_site)
        rows.append(
            pd.DataFrame(
                {
                    "ts": pd.date_range("2022-01-01", periods=per_site, freq="h", tz="UTC"),
                    "epa_site": f"site{s}",
                    "pa_id": 1000 + s,
                    "epa_pm25": epa,
                    "pa_cf1": pa,
                    "rh": rh,
                    "dist_m": 100.0,
                }
            )
        )
    return pd.concat(rows, ignore_index=True)


def test_metrics_known_values():
    y = [1.0, 2.0, 3.0]
    yhat = [2.0, 3.0, 4.0]  # +1 everywhere
    m = metrics(y, yhat)
    assert m["mae"] == pytest.approx(1.0)
    assert m["bias"] == pytest.approx(1.0)
    assert m["r"] == pytest.approx(1.0)


def test_qc_drops_disagreeing_and_nan_channels():
    hourly = pd.DataFrame(
        {
            "sensor_index": [1, 1, 1, 1],
            "ts": pd.date_range("2022-01-01", periods=4, freq="h", tz="UTC"),
            "pm25_cf1_a": [10.0, 10.0, 10.0, np.nan],  # row2: A/B disagree hard
            "pm25_cf1_b": [10.4, 100.0, 9.6, 10.0],
            "rh": [50.0, 50.0, 50.0, 50.0],
        }
    )
    out = qc_pa(hourly)
    assert len(out) == 2  # kept rows 0 and 2; dropped disagree + NaN
    assert out["pa_cf1"].iloc[0] == pytest.approx(10.2)


def test_loso_split_is_disjoint():
    pairs = synthetic_pairs()
    train, test = loso_split(pairs, "site0")
    assert "site0" not in set(train["epa_site"])
    assert set(test["epa_site"]) == {"site0"}


def test_leak_injection_fails():
    """The reported split must reject a test site that appears in train."""
    pairs = synthetic_pairs()
    train, _ = loso_split(pairs, "site0")
    leaked = pd.concat([train, pairs[pairs["epa_site"] == "site0"]], ignore_index=True)
    with pytest.raises(ValueError, match="leak"):
        check_no_leak(leaked, "site0")


def test_evaluate_runs_and_loso_is_not_better_than_same_site():
    pairs = synthetic_pairs()
    m = evaluate(pairs, "site0")
    assert m["n_sites"] == 4
    assert m["test_id"] == "site0"
    # a fair split: leaving a site out should not beat fitting on it
    assert m["mae_loso"] >= m["mae_same_site"] - 1e-6


def test_ablation_has_three_columns_and_ols_beats_raw_on_linear_data():
    pairs = synthetic_pairs()
    rows = ablation(pairs, "site0")
    assert [r["model"] for r in rows] == ["raw", "barkjohn", "ols"]
    by = {r["model"]: r["mae"] for r in rows}
    assert by["ols"] < by["raw"]  # synthetic EPA is linear in the features
