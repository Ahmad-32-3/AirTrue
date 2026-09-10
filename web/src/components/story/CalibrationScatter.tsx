// Official reading on the x-axis, sensor estimate on the y-axis. Points on the
// diagonal are an exact match. The raw sensor points (open circles) sit above
// the line; the corrected points (filled crosses) sit on it. Shape, not just
// color, tells the two apart.

import { SCATTER, SCATTER_MAX } from '../../data'

const W = 340
const H = 320
const PAD = { l: 40, r: 14, t: 14, b: 36 }

export function CalibrationScatter() {
  const max = SCATTER_MAX
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b
  const x = (v: number) => PAD.l + (v / max) * plotW
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH
  const ticks = [0, Math.round(max / 2), max]

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scatter of estimate versus EPA truth. Raw laser points sit above the one-to-one line; corrected points sit on it.">
        {/* 1:1 reference */}
        <line x1={x(0)} y1={y(0)} x2={x(max)} y2={y(max)} stroke="var(--chart-truth)" strokeWidth="1" strokeDasharray="4 3" />
        <text x={x(max) - 2} y={y(max) + 14} textAnchor="end" fontSize="10" fill="var(--chart-label)" fontFamily="var(--font-mono)">
          1:1 (perfect)
        </text>
        {ticks.map((t) => (
          <g key={t}>
            <text x={x(t)} y={H - 20} textAnchor="middle" fontSize="10" fill="var(--chart-label)" fontFamily="var(--font-mono)">{t}</text>
            <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--chart-label)" fontFamily="var(--font-mono)">{t}</text>
          </g>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--chart-label)" fontFamily="var(--font-mono)">official monitor µg/m³</text>
        {/* raw: open circles */}
        {SCATTER.map((p, i) => (
          <circle key={`r${i}`} className="mix-cell" cx={x(p.epa)} cy={y(p.raw)} r="3.4" fill="none" stroke="var(--chart-raw)" strokeWidth="1.4" style={{ animationDelay: `${i * 12}ms` }} />
        ))}
        {/* corrected: filled crosses */}
        {SCATTER.map((p, i) => (
          <g key={`c${i}`} className="mix-cell" style={{ animationDelay: `${i * 12 + 120}ms` }}>
            <line x1={x(p.epa) - 3} y1={y(p.ols)} x2={x(p.epa) + 3} y2={y(p.ols)} stroke="var(--chart-corrected)" strokeWidth="1.6" />
            <line x1={x(p.epa)} y1={y(p.ols) - 3} x2={x(p.epa)} y2={y(p.ols) + 3} stroke="var(--chart-corrected)" strokeWidth="1.6" />
          </g>
        ))}
      </svg>
      <ul className="legend">
        <li><span className="swatch" style={{ borderColor: 'var(--chart-raw)', background: 'transparent' }} /> raw sensor (reads high)</li>
        <li><span className="swatch" style={{ borderColor: 'var(--chart-corrected)', background: 'var(--chart-corrected)' }} /> my correction (on the line)</li>
      </ul>
    </div>
  )
}
