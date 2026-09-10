# AirTrue

Cheap backyard air sensors measure fine particle pollution (PM2.5), but they do not match the official government monitors.

I learn a correction from sensors that sit next to an official monitor, then I test that correction at an official site I held out. Same-site checks are only for debugging. The number I trust is error on the held-out site, printed next to same-site error.

Headline: leave-one-site-out MAE, bias, and Pearson r. This is a calibration study, not an AQI forecast.

## Data

PurpleAir public sensors plus EPA AQS PM2.5 (FRM/FEM). Paper: [Barkjohn et al. 2021](https://doi.org/10.5194/amt-14-4617-2021).

## Run

```bash
python -m pytest tests/ -q
python scripts/run.py
npm --prefix web install
npm --prefix web run dev
```

Missing PurpleAir or AQS keys: leak tests, CLI, and an illustrative walkthrough still ship. The CLI prints a one-line blocker.

## Layout

- `src/` calibration and eval
- `scripts/run.py`
- `tests/` leak injection must fail inside the test file
- `web/` case-study page
