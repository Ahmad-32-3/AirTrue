# MAE, mean bias, Pearson r. Build the loso-vs-same-site metrics dict and print it.

import numpy as np

from . import const
from .fit import barkjohn, fit_ols, predict_ols
from .split import loso_split, same_site_split


def metrics(y, yhat):
    y = np.asarray(y, float)
    yhat = np.asarray(yhat, float)
    mae = float(np.mean(np.abs(yhat - y)))
    bias = float(np.mean(yhat - y))
    r = float(np.corrcoef(y, yhat)[0, 1]) if len(y) > 1 else float("nan")
    return {"mae": mae, "bias": bias, "r": r}


def evaluate(pairs, test_id, features=const.FEATURES):
    """Fit OLS on train sites, score the held-out site (loso) and, for debug,
    fit+score on the held-out site (same_site). Barkjohn is a no-fit column."""
    train, test = loso_split(pairs, test_id)
    ols = fit_ols(train, features)
    m_loso = metrics(test["epa_pm25"], predict_ols(ols, test, features))
    m_bark = metrics(test["epa_pm25"], barkjohn(test))
    m_raw = metrics(test["epa_pm25"], test["pa_cf1"])

    s_train, s_test = same_site_split(pairs, test_id)
    m_same = metrics(s_test["epa_pm25"], predict_ols(fit_ols(s_train, features), s_test, features))

    sites = sorted(pairs["epa_site"].unique())
    return {
        "mae_loso": m_loso["mae"],
        "bias_loso": m_loso["bias"],
        "r_loso": m_loso["r"],
        "mae_same_site": m_same["mae"],
        "mae_barkjohn_loso": m_bark["mae"],
        "mae_raw_loso": m_raw["mae"],
        "n_train": int(len(train)),
        "n_test": int(len(test)),
        "n_sites": len(sites),
        "n_sensors": int(pairs["pa_id"].nunique()),
        "train_ids": [s for s in sites if s != test_id],
        "test_id": test_id,
        "features": list(features),
    }


def print_report(m):
    print(
        f"loso MAE {m['mae_loso']:.2f}  |  same-site MAE {m['mae_same_site']:.2f}  "
        f"|  Barkjohn loso MAE {m['mae_barkjohn_loso']:.2f}  |  raw loso MAE {m['mae_raw_loso']:.2f}"
    )
    print(
        f"loso bias {m['bias_loso']:+.2f}  r {m['r_loso']:.3f}  "
        f"| n_sites {m['n_sites']} n_sensors {m['n_sensors']} "
        f"n_train {m['n_train']} n_test {m['n_test']} test_id {m['test_id']}"
    )
