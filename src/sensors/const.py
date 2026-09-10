# All tunable numbers for the reported slice live here (DESIGN "Defaults").
# One metro, one year, capped. Change the metro with an ADR line in DESIGN.md.

CBSA = "41620"  # Salt Lake City
YEAR = 2022

AQS_PARAM = "88101"  # PM2.5 FRM/FEM mass, the federal reference channel

PAIR_DIST_M = 500.0          # outdoor PA must sit this close to an AQS site
PAIR_DIST_FALLBACK_M = 1000.0  # only if n_sites < 3, and it is printed
MAX_SITES = 8
MAX_SENSORS = 40

QC_AB_REL = 0.70  # drop the hour if abs(A-B)/mean(A,B) exceeds this

FEATURES = ["pa_cf1", "rh"]

# Barkjohn et al. 2021 US-wide correction. A column I did not fit.
# PM2.5 = 0.524*PA_cf1 - 0.0862*RH + 5.75
BARKJOHN = {"pa_cf1": 0.524, "rh": -0.0862, "intercept": 5.75}
