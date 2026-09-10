// Every number the page shows lives here, on purpose.
//
// ILLUSTRATIVE: these are placeholder numbers, not a measured run. The metro
// has no PurpleAir/AQS keys on disk yet, so scripts/download.py stops and the
// pipeline has not written real metrics. The shapes match what the Barkjohn
// 2021 study reports for this kind of correction (the raw sensor reads high, a
// simple formula using humidity pulls it back), so the page shows the real
// pattern without claiming a result I have not measured.
//
// When keys land, scripts/run.py writes metrics.json and eval flips ILLUSTRATIVE
// to false with the real numbers. Until then every caption says placeholder.

export const ILLUSTRATIVE = true

export const META = {
  metro: 'Salt Lake City',
  cbsa: '41620',
  year: 2022,
  distM: 500,
  features: ['pa_cf1', 'rh'] as const,
}

// The five official monitor sites in the study. Labels stand in for the site
// codes. One site is held out for the reported number; the correction is built
// from the other four.
export const SPLIT = {
  trainIds: ['Rose Park', 'Bountiful', 'Herriman', 'Magna'],
  testId: 'Hawthorne',
}

// Headline numbers, all measured at the held-out site. Average error is in
// micrograms per cubic metre: how far the estimate is from the official reading,
// on average.
export const METRICS = {
  maeRawLoso: 6.8, // the cheap sensor with no correction
  maeBarkjohnLoso: 2.6, // the published formula, applied without any fitting
  maeOlsLoso: 2.4, // my correction, built from the other four sites
  maeSameSite: 2.0, // check: build and test on the same site
  rLoso: 0.9, // how closely the corrected reading tracks the monitor (1.0 is exact)
  biasLoso: -0.4, // average estimate minus average reading
  nSites: 5,
  nSensors: 28,
  nTrain: 41200,
  nTest: 7950,
}

// A fixed week generator so the traces are the same numbers every load, not
// random. Overnight, cool air traps humidity and pollution near the ground; the
// cheap laser sensor reads especially high in those hours, and the corrections
// bring it back down to the monitor.
function week(seed: number, hours: number) {
  let s = seed
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const epa: number[] = []
  const raw: number[] = []
  const ols: number[] = []
  const bark: number[] = []
  const rh: number[] = []
  for (let t = 0; t < hours; t++) {
    const hod = t % 24
    const inversion = Math.max(0, Math.cos(((hod - 3) / 24) * 2 * Math.PI)) // peaks overnight
    const humid = 45 + 35 * inversion + 6 * (rand() - 0.5)
    const truth = 6 + 6 * inversion + 3 * Math.sin((t / 17) * Math.PI) + 1.2 * (rand() - 0.5)
    const e = Math.max(1, truth)
    rh.push(Math.round(humid))
    epa.push(round1(e))
    raw.push(round1(e * 1.28 + 0.09 * humid + 1.0 * (rand() - 0.5)))
    ols.push(round1(e + 0.6 * (rand() - 0.5)))
    bark.push(round1(e + 0.5 + 0.7 * (rand() - 0.5)))
  }
  return { epa, raw, ols, bark, rh }
}

function round1(x: number) {
  return Math.round(x * 10) / 10
}

const HOURS = 96 // four days, readable at this width

// Problem chart: one cheap sensor next to one official monitor, both readings.
const problemWeek = week(7, HOURS)
export const PROBLEM_WEEK = {
  hours: HOURS,
  epa: problemWeek.epa,
  raw: problemWeek.raw,
}

// Result chart: the held-out site over the same period, four readings.
const resultWeek = week(23, HOURS)
export const HELDOUT_WEEK = {
  hours: HOURS,
  epa: resultWeek.epa,
  raw: resultWeek.raw,
  ols: resultWeek.ols,
  bark: resultWeek.bark,
}

// Scatter: the official reading on the x-axis, the estimate on the y-axis. Two
// sets of points, before and after correction. Points on the diagonal are an
// exact match. A 40-hour sample from the held-out site.
export type ScatterPoint = { epa: number; raw: number; ols: number }
export const SCATTER: ScatterPoint[] = Array.from({ length: 40 }, (_, i) => ({
  epa: resultWeek.epa[i],
  raw: resultWeek.raw[i],
  ols: resultWeek.ols[i],
}))

export const SCATTER_MAX = Math.ceil(
  Math.max(...SCATTER.map((p) => Math.max(p.epa, p.raw, p.ols))) + 2,
)

// The four numbers in the result strip.
export type Counter = { key: string; label: string; value: number; unit: string; note: string }
export const COUNTERS: Counter[] = [
  { key: 'ols', label: 'Average error, my correction', value: METRICS.maeOlsLoso, unit: 'µg/m³', note: 'at a monitor left out when building it' },
  { key: 'raw', label: 'Average error, raw sensor', value: METRICS.maeRawLoso, unit: 'µg/m³', note: 'no correction applied' },
  { key: 'bark', label: 'Average error, published formula', value: METRICS.maeBarkjohnLoso, unit: 'µg/m³', note: 'the Barkjohn formula, for comparison' },
  { key: 'r', label: 'Match with the monitor', value: METRICS.rLoso, unit: '', note: '1.0 is an exact match' },
]

// Comparison table, all at the held-out site.
export const COMPARISON = [
  { metric: 'Average error (µg/m³)', raw: '6.8', barkjohn: '2.6', ols: '2.4', best: 'ols' },
  { metric: 'Average over-reading (µg/m³)', raw: '+5.1', barkjohn: '+0.6', ols: '-0.4', best: 'ols' },
  { metric: 'Match with the monitor', raw: '0.86', barkjohn: '0.89', ols: '0.90', best: 'ols' },
  { metric: 'What it is based on', raw: 'nothing', barkjohn: 'US-wide data', ols: 'the other sites', best: 'tie' },
] as const

export const DECISIONS = [
  {
    first: 'Show the cheap sensor readings as the real air quality',
    built: 'Correct each sensor against a nearby official monitor first',
  },
  {
    first: 'Build and test the correction on the same sensors',
    built: 'Test at a monitor left out when the correction was built',
  },
  {
    first: 'Report one accuracy score',
    built: 'Report average error, over-reading, and match at the held-out site',
  },
  {
    first: 'Use a complex machine-learning model',
    built: 'Use a simple formula, with the published one for comparison',
  },
] as const

export type Tool = { name: string; tag: string; plain: string; tech: string }
export const STACK: Tool[] = [
  {
    name: 'pandas + numpy',
    tag: 'data',
    plain: 'Loads the sensor and monitor files and lines up the matching hours.',
    tech: 'Reads the official hourly CSV and the PurpleAir readings, averages the sensor’s two internal detectors at the CF=1 setting (the reading before the sensor applies its own humidity adjustment), and joins them by hour and site.',
  },
  {
    name: 'distance pairing',
    tag: 'pair',
    plain: 'Matches each cheap sensor to the official monitor closest to it.',
    tech: 'A distance calculation keeps an outdoor PurpleAir only if it is within 500 m of an official PM2.5 site. Staying close is what makes the two readings comparable.',
  },
  {
    name: 'two-detector check',
    tag: 'clean',
    plain: 'Throws out any hour where the sensor’s two detectors disagree.',
    tech: 'Each PurpleAir has two detectors. If they differ by more than 70% of their average, or either is blank, that hour is dropped before the correction is built.',
  },
  {
    name: 'scikit-learn regression',
    tag: 'fit',
    plain: 'The correction itself: a formula from the sensor reading and humidity to the official value.',
    tech: 'A linear regression with two inputs, the sensor reading and relative humidity, fit only on the sites that are not being tested.',
  },
  {
    name: 'Barkjohn 2021 formula',
    tag: 'baseline',
    plain: 'A published correction used in the US, applied here without any fitting.',
    tech: 'PM2.5 = 0.524 × sensor − 0.0862 × humidity + 5.75. If it already matches the monitor on this metro, the table shows that.',
  },
  {
    name: 'Vite, React, motion',
    tag: 'page',
    plain: 'Builds this page and draws the charts.',
    tech: 'React and Tailwind on Vite, with the motion library for the section reveals and the number roll-up. The charts are hand-drawn SVG that read the numbers above, so the page makes no network calls.',
  },
]

export const NEXT = [
  'One metro is the stopping point for now. The next step is a second metro, to see whether a correction built in Salt Lake City still works elsewhere.',
  'A rule for dust storms, when the laser sensor breaks down, shown as its own column.',
  'The EPA 2022 correction as a third formula next to Barkjohn.',
]
