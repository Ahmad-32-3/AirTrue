// Hold-one-site-out, drawn. The correction is built from the four sites on the
// left and tested only on the one held out on the right. The held-out site is
// never used to build the correction.

import { SPLIT } from '../../data'

export function SplitViz() {
  return (
    <div className="teach-card">
      <h3 className="teach-card__title">One site held out for the test</h3>
      <div className="split-row">
        <div className="split-col">
          <p className="meta split-col__head">Build the correction from these</p>
          <div className="split-chips">
            {SPLIT.trainIds.map((id) => (
              <span key={id} className="chip chip--train">{id}</span>
            ))}
          </div>
        </div>
        <div className="split-arrow" aria-hidden="true">→</div>
        <div className="split-col">
          <p className="meta split-col__head">Test it here</p>
          <div className="split-chips">
            <span className="chip chip--held">{SPLIT.testId}</span>
          </div>
        </div>
      </div>
      <p className="meta" style={{ margin: '0.75rem 0 0', textTransform: 'none', letterSpacing: 0 }}>
        The number I report comes from a site the correction was not built from. Every outdoor sensor
        within 500 metres of that monitor is tested against it. Building and testing on the same site
        would just measure how well the formula memorised that one place, so I keep it separate.
      </p>
    </div>
  )
}
