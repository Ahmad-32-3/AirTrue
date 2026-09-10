# Ablation on the reported loso split: raw PA vs Barkjohn (no fit) vs my OLS.
# Same split as eval.evaluate. Keep the worse columns; the table is the point.
# Optional dust-out column waits for evidence (a documented rule + both columns).

from . import const
from .eval import metrics
from .fit import barkjohn, fit_ols, predict_ols
from .split import loso_split


def ablation(pairs, test_id, features=const.FEATURES):
    """Three columns scored on the same held-out site."""
    train, test = loso_split(pairs, test_id)
    ols = fit_ols(train, features)
    return [
        {"model": "raw", "fit": "none", **metrics(test["epa_pm25"], test["pa_cf1"])},
        {"model": "barkjohn", "fit": "published", **metrics(test["epa_pm25"], barkjohn(test))},
        {"model": "ols", "fit": "train sites", **metrics(test["epa_pm25"], predict_ols(ols, test, features))},
    ]


def print_table(rows):
    print(f"{'model':<10}{'fit':<14}{'MAE':>8}{'bias':>9}{'r':>8}")
    for r in rows:
        print(f"{r['model']:<10}{r['fit']:<14}{r['mae']:>8.2f}{r['bias']:>+9.2f}{r['r']:>8.3f}")
