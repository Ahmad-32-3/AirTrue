import { CalibrationScatter } from './components/story/CalibrationScatter'
import { LineChart } from './components/story/LineChart'
import { ResultBento } from './components/story/ResultBento'
import { SplitViz } from './components/story/SplitViz'
import { StackGrid } from './components/story/StackGrid'
import { StoryBeat } from './components/story/StoryBeat'
import {
  COMPARISON,
  DECISIONS,
  HELDOUT_WEEK,
  ILLUSTRATIVE,
  META,
  METRICS,
  NEXT,
  PROBLEM_WEEK,
  SPLIT,
} from './data'

const TOC = [
  { href: '#problem', label: 'The problem' },
  { href: '#answer', label: 'The approach' },
  { href: '#result', label: 'The result' },
  { href: '#decisions', label: 'Design choices' },
  { href: '#stack', label: 'How it works' },
  { href: '#use', label: 'Running it' },
  { href: '#next', label: 'What is next' },
]

const NOTE = ILLUSTRATIVE ? ' These are placeholder numbers until the pipeline runs.' : ''

export function App() {
  return (
    <>
      <a className="skip-link" href="#problem">
        Skip to the walkthrough
      </a>

      <div className="masthead">
        <div className="masthead__inner">
          <div className="masthead__mark">
            <b>AirTrue</b> · making cheap air sensors read like the official monitor
          </div>
          <ul className="masthead__nav">
            <li><a href="#problem">problem</a></li>
            <li><a href="#answer">approach</a></li>
            <li><a href="#result">result</a></li>
            <li><a href="#stack">how</a></li>
          </ul>
        </div>
      </div>

      <main className="page">
        <header className="page-hero">
          <p className="meta">A walkthrough · correcting low-cost air sensors against the official monitor</p>
          <h1>AirTrue</h1>
          <p className="lead">
            Cheap backyard air sensors measure fine particle pollution (PM2.5), but they do not match
            the official government monitors. I learn a correction from sensors that sit next to an
            official monitor, then I test that correction at an official site I held out. Same-site
            checks are only for debugging. The number I trust is error on the held-out site, printed
            next to same-site error.
          </p>
          <p className="intro-detail">
            PM2.5 is measured in micrograms per cubic metre. The official monitors are the accurate,
            reference-grade instruments the US government runs (labelled FRM and FEM). This is a
            portfolio project on one metro area, {META.metro}, for {META.year}.
            {ILLUSTRATIVE ? ' The numbers here are placeholders until I run the full pipeline with data access; every caption says so.' : ''}
          </p>
          <nav aria-label="On this page">
            <ul className="toc">
              {TOC.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <StoryBeat
          id="problem"
          kicker="The problem"
          title="The cheap sensors read too high"
          caption={`One cheap sensor next to one official monitor, over four days. The sensor reads higher than the monitor, and the gap is widest in the humid overnight hours.${NOTE}`}
          visual={
            <LineChart
              hours={PROBLEM_WEEK.hours}
              series={[
                { label: 'official monitor', color: 'var(--chart-truth)', values: PROBLEM_WEEK.epa, width: 2.6 },
                { label: 'raw sensor', color: 'var(--chart-raw)', values: PROBLEM_WEEK.raw, dash: '7 4' },
              ]}
            />
          }
        >
          <p>
            Official air-quality monitors are accurate but sparse. A whole metro area might have only a
            handful of them. Cheap PurpleAir sensors are everywhere by comparison, so it is tempting to
            treat their readings as the air everyone is breathing.
          </p>
          <p>
            The trouble is accuracy. A cheap sensor shines a laser through the air and estimates
            pollution from how much light the particles scatter. That estimate tends to come out too
            high, and humidity makes it worse: damp particles scatter more light, so the sensor reads
            highest on humid nights. Publishing those raw numbers as the real air quality would spread
            a reading that is consistently off.
          </p>
          <p>
            So the sensor needs a correction. A correction built and tested on the same sensors can
            look perfect while failing on any sensor it has not seen. To trust it, I have to test it
            somewhere new.
          </p>
        </StoryBeat>

        <StoryBeat
          id="answer"
          kicker="The approach"
          title="Build the correction on some sites, test it on another"
          caption={`The correction is built from four monitor sites and tested on a fifth that was left out. The Barkjohn formula is a published correction, shown alongside for comparison.${NOTE}`}
          visual={<SplitViz />}
        >
          <p>
            I use hours when a cheap sensor sits within 500 metres of an official monitor, so the two
            are measuring the same air. Each sensor has two internal detectors; I average them and
            drop any hour where they disagree, which removes bad readings.
          </p>
          <p>
            From those matched hours I build a simple formula that turns the sensor reading and the
            humidity into an estimate of the official value. I build it from four of the monitor sites
            and then test it at a fifth site that was left out. Testing at a site the formula never saw
            is the check I stand behind: if I tested at a site I built it from, a formula that just
            memorised that location would still score well. Same-site error stays on the page as a
            debug column.
          </p>
          <p>
            I also run a published correction from a 2021 study by Barkjohn and colleagues, applied
            without any fitting of my own, as a side-by-side comparison. If that formula already
            matches the monitor on this metro, the results show it.
          </p>
        </StoryBeat>

        <StoryBeat
          id="result"
          kicker="The result"
          title="The corrected reading matches the monitor"
          caption={`The held-out site over four days: the official monitor, the raw sensor, my correction, and the Barkjohn formula. Both corrections track the monitor closely; the raw sensor stays well above it.${NOTE}`}
          visual={
            <LineChart
              hours={HELDOUT_WEEK.hours}
              yMax={Math.ceil(Math.max(...HELDOUT_WEEK.raw) + 2)}
              series={[
                { label: 'official monitor', color: 'var(--chart-truth)', values: HELDOUT_WEEK.epa, width: 2.6 },
                { label: 'raw sensor', color: 'var(--chart-raw)', values: HELDOUT_WEEK.raw, dash: '7 4' },
                { label: 'my correction', color: 'var(--chart-corrected)', values: HELDOUT_WEEK.ols, width: 2 },
                { label: 'Barkjohn formula', color: 'var(--bad)', values: HELDOUT_WEEK.bark, dash: '2 4', width: 2 },
              ]}
            />
          }
        >
          <p>
            Here are the numbers at the held-out site. Average error is how far the estimate is from
            the official reading, on average, in micrograms per cubic metre. Lower is better.
          </p>
          <ResultBento />
          <p style={{ marginTop: 'var(--space-5)' }}>
            The scatter below shows the same result a different way. Each point is one hour: the
            official reading across the bottom, the estimate up the side. Points on the diagonal are an
            exact match. The raw sensor points sit above the line, reading high; the corrected points
            fall onto it. On this metro the Barkjohn formula lands close behind my correction, which is
            why it stays in the table.
          </p>
          <div className="result-charts">
            <CalibrationScatter />
            <table className="choice-table">
              <caption className="sr-only">Raw sensor, Barkjohn formula, and my correction at the same held-out site</caption>
              <thead>
                <tr>
                  <th scope="col">At the held-out site</th>
                  <th scope="col">Raw</th>
                  <th scope="col">Barkjohn</th>
                  <th scope="col">My correction</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.metric}>
                    <td>{r.metric}</td>
                    <td>{r.raw}</td>
                    <td>{r.barkjohn}</td>
                    <td style={{ color: r.best === 'ols' ? 'var(--good)' : 'var(--fg)' }}>{r.ols}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="meta" style={{ textTransform: 'none', letterSpacing: 0, marginTop: 'var(--space-4)' }}>
            When I build and test on the same site, the error is {METRICS.maeSameSite} µg/m³, lower
            than the {METRICS.maeOlsLoso} at the held-out site. That gap is expected: testing where you
            built the correction always looks better, which is why I report the held-out number. It
            comes from {METRICS.nSites} sites and {METRICS.nSensors} sensors.{NOTE}
          </p>
        </StoryBeat>

        <StoryBeat
          id="decisions"
          kicker="Design choices"
          title="The calls I made"
          caption="What I first reached for, and what I built instead."
          visual={
            <div className="teach-card">
              <h3 className="teach-card__title">First idea, and what I built</h3>
              <table className="choice-table">
                <caption className="sr-only">Design choices</caption>
                <thead>
                  <tr>
                    <th scope="col">First idea</th>
                    <th scope="col">What I built</th>
                  </tr>
                </thead>
                <tbody>
                  {DECISIONS.map((d) => (
                    <tr key={d.first}>
                      <td>{d.first}</td>
                      <td>{d.built}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        >
          <p>
            <strong>I corrected the readings before mapping them.</strong> A dense map of cheap sensors
            is only useful once each sensor reads like the monitor near it. The correction comes first;
            the map is what you get afterward.
          </p>
          <p>
            <strong>I tested at a site I left out.</strong> Splitting the data by hour within a single
            site would let the formula memorise that site and still score well. Holding out a whole
            monitor location is a harder test, which is why passing it means something.
          </p>
          <p>
            <strong>I kept the formula simple.</strong> Two inputs and a straight line, with the
            published formula next to it. A heavier machine-learning model would be harder to check and
            harder to compare, and I have no evidence yet that it would do better.
          </p>
        </StoryBeat>

        <section className="story-beat" id="stack">
          <p className="story-kicker">How it works</p>
          <h2>The tools, in plain terms</h2>
          <p className="stack-intro">
            Standard tools for this kind of data, so anyone can clone the repo and rerun the numbers.
            Each card is one piece: what it does, then how it does it.
          </p>
          <StackGrid />
        </section>

        <section className="story-beat" id="use">
          <p className="story-kicker">Running it</p>
          <h2>Clone it, add access, run it</h2>
          <p style={{ maxWidth: 'var(--measure)' }}>
            The pipeline needs a PurpleAir read key and official AQS credentials, or the annual public
            data files dropped in <code>data/epa/</code>. Without them the download step stops on
            purpose and the page keeps its placeholder numbers.
          </p>
          <ol className="stack-list" style={{ maxWidth: 'var(--measure)' }}>
            <li>Put <code>PURPLEAIR_READ_KEY</code>, <code>AQS_EMAIL</code>, and <code>AQS_KEY</code> in <code>.env</code>.</li>
            <li>Run <code>python scripts/run.py --cbsa {META.cbsa} --year {META.year} --test-id {SPLIT.testId}</code>. It writes <code>metrics.json</code> and prints the held-out error next to the same-site error.</li>
            <li>Run <code>npm --prefix web run dev</code> to read this page. Once real numbers land, they replace the placeholders and the captions drop the warning.</li>
          </ol>
        </section>

        <section className="story-beat" id="next">
          <p className="story-kicker">What is next</p>
          <h2>Where I would take it</h2>
          <ul className="stack-list" style={{ maxWidth: 'var(--measure)' }}>
            {NEXT.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>

        <footer
          id="close"
          style={{
            borderTop: '1px solid var(--line-rule)',
            paddingTop: 'var(--space-6)',
            marginTop: 'var(--space-6)',
            color: 'var(--fg-low)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <p style={{ maxWidth: 'var(--measure)' }}>
            Data: PurpleAir public outdoor sensors and EPA AQS PM2.5 (parameter 88101). The comparison
            formula is from Barkjohn et al. 2021 (amt-14-4617-2021). This is a portfolio project on one
            metro and one hold-out split, not a replacement for official air-quality reporting and not
            an air-quality forecast.{ILLUSTRATIVE ? ' The numbers here are placeholders until the pipeline replaces them.' : ''}
          </p>
        </footer>
      </main>
    </>
  )
}
