// Lightweight inline SVG illustrations for Smart Study Zone topics.
// Stored as raw SVG markup so they work on both web (data: URI in <img>)
// and React Native (react-native-svg's SvgXml). No network dependency,
// each one is well under 1 KB.
//
// Convention:
//   - viewBox="0 0 240 160" so all illustrations share the same aspect.
//   - Use plain attribute values (no '#' chars except in fill colors,
//     which are escaped at render time on web).
//   - Keep palette to a handful of friendly colors.

const W = 240, H = 160;

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">${inner}</svg>`;

// ─── Math (basic) ─────────────────────────────────────────────────────────────

export const IMG_ADDITION = wrap(`
  <rect width="240" height="160" fill="#fef3c7"/>
  <g transform="translate(20,55)" fill="#ef4444">
    <circle cx="15" cy="25" r="14"/><circle cx="50" cy="25" r="14"/>
  </g>
  <text x="100" y="92" font-family="Verdana" font-size="34" font-weight="bold" fill="#1f2937" text-anchor="middle">+</text>
  <g transform="translate(115,55)" fill="#22c55e">
    <circle cx="15" cy="25" r="14"/><circle cx="50" cy="25" r="14"/><circle cx="15" cy="60" r="14"/>
  </g>
  <text x="200" y="92" font-family="Verdana" font-size="34" font-weight="bold" fill="#1f2937" text-anchor="middle">= 5</text>
`);

export const IMG_FRACTIONS = wrap(`
  <rect width="240" height="160" fill="#fef3c7"/>
  <circle cx="80" cy="80" r="55" fill="#fcd34d" stroke="#92400e" stroke-width="3"/>
  <path d="M80 80 L80 25 A55 55 0 0 1 135 80 Z" fill="#dc2626" stroke="#92400e" stroke-width="3"/>
  <line x1="80" y1="25" x2="80" y2="135" stroke="#92400e" stroke-width="3"/>
  <line x1="25" y1="80" x2="135" y2="80" stroke="#92400e" stroke-width="3"/>
  <text x="190" y="70" font-family="Verdana" font-size="34" font-weight="bold" fill="#dc2626" text-anchor="middle">1</text>
  <line x1="170" y1="78" x2="210" y2="78" stroke="#dc2626" stroke-width="3"/>
  <text x="190" y="110" font-family="Verdana" font-size="34" font-weight="bold" fill="#dc2626" text-anchor="middle">4</text>
`);

export const IMG_MULTIPLICATION = wrap(`
  <rect width="240" height="160" fill="#e0f2fe"/>
  <g fill="#0284c7">
    ${[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) =>
        `<circle cx="${50 + c * 35}" cy="${40 + r * 35}" r="11"/>`
      ).join("")
    ).join("")}
  </g>
  <text x="200" y="95" font-family="Verdana" font-size="22" font-weight="bold" fill="#0c4a6e">3 × 4</text>
  <text x="200" y="120" font-family="Verdana" font-size="22" font-weight="bold" fill="#0c4a6e">= 12</text>
`);

// ─── Science (basic) ──────────────────────────────────────────────────────────

export const IMG_PLANTS = wrap(`
  <rect width="240" height="160" fill="#ecfdf5"/>
  <rect x="80" y="120" width="80" height="20" fill="#92400e"/>
  <line x1="120" y1="120" x2="120" y2="50" stroke="#16a34a" stroke-width="4"/>
  <ellipse cx="100" cy="80" rx="22" ry="12" fill="#22c55e" transform="rotate(-25 100 80)"/>
  <ellipse cx="140" cy="80" rx="22" ry="12" fill="#22c55e" transform="rotate(25 140 80)"/>
  <circle cx="120" cy="45" r="14" fill="#f472b6"/>
  <circle cx="120" cy="45" r="6" fill="#fde047"/>
  <line x1="115" y1="140" x2="100" y2="155" stroke="#92400e" stroke-width="2"/>
  <line x1="125" y1="140" x2="140" y2="155" stroke="#92400e" stroke-width="2"/>
  <text x="180" y="50" font-family="Verdana" font-size="11" fill="#0f172a">flower</text>
  <text x="180" y="85" font-family="Verdana" font-size="11" fill="#0f172a">leaves</text>
  <text x="180" y="125" font-family="Verdana" font-size="11" fill="#0f172a">stem</text>
  <text x="180" y="150" font-family="Verdana" font-size="11" fill="#0f172a">roots</text>
`);

export const IMG_STATES_OF_MATTER = wrap(`
  <rect width="240" height="160" fill="#f0f9ff"/>
  <rect x="20"  y="40" width="55" height="80" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
  <rect x="32"  y="55" width="30" height="50" fill="#1d4ed8"/>
  <text x="47" y="140" font-family="Verdana" font-size="12" fill="#1d4ed8" text-anchor="middle">Solid</text>
  <rect x="92"  y="40" width="55" height="80" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
  <path d="M92 90 Q120 78 147 90 L147 120 L92 120 Z" fill="#3b82f6"/>
  <text x="120" y="140" font-family="Verdana" font-size="12" fill="#1d4ed8" text-anchor="middle">Liquid</text>
  <rect x="164" y="40" width="55" height="80" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
  <g fill="#60a5fa">
    <circle cx="180" cy="60" r="4"/><circle cx="200" cy="75" r="4"/>
    <circle cx="175" cy="95" r="4"/><circle cx="205" cy="105" r="4"/>
    <circle cx="190" cy="85" r="4"/>
  </g>
  <text x="192" y="140" font-family="Verdana" font-size="12" fill="#1d4ed8" text-anchor="middle">Gas</text>
`);

// ─── English (basic) ──────────────────────────────────────────────────────────

export const IMG_NOUNS = wrap(`
  <rect width="240" height="160" fill="#fdf2f8"/>
  <text x="120" y="30" font-family="Verdana" font-size="14" font-weight="bold" fill="#9d174d" text-anchor="middle">Nouns name things</text>
  <g font-family="Verdana" font-size="11" fill="#0f172a" text-anchor="middle">
    <text x="50"  y="120">girl</text>
    <text x="110" y="120">school</text>
    <text x="170" y="120">dog</text>
    <text x="220" y="120">book</text>
  </g>
  <text x="50"  y="90" font-size="38" text-anchor="middle">👧</text>
  <text x="110" y="90" font-size="38" text-anchor="middle">🏫</text>
  <text x="170" y="90" font-size="38" text-anchor="middle">🐶</text>
  <text x="220" y="90" font-size="38" text-anchor="middle">📕</text>
`);

export const IMG_VERBS = wrap(`
  <rect width="240" height="160" fill="#eff6ff"/>
  <text x="120" y="30" font-family="Verdana" font-size="14" font-weight="bold" fill="#1e40af" text-anchor="middle">Verbs are action words</text>
  <g font-family="Verdana" font-size="11" fill="#0f172a" text-anchor="middle">
    <text x="50"  y="120">run</text>
    <text x="110" y="120">eat</text>
    <text x="170" y="120">jump</text>
    <text x="220" y="120">write</text>
  </g>
  <text x="50"  y="90" font-size="38" text-anchor="middle">🏃</text>
  <text x="110" y="90" font-size="38" text-anchor="middle">🍽️</text>
  <text x="170" y="90" font-size="38" text-anchor="middle">🤸</text>
  <text x="220" y="90" font-size="38" text-anchor="middle">✍️</text>
`);

// ─── Math (advanced) ─────────────────────────────────────────────────────────

export const IMG_ALGEBRA = wrap(`
  <rect width="240" height="160" fill="#ede9fe"/>
  <text x="120" y="70" font-family="Verdana" font-size="32" font-weight="bold" fill="#5b21b6" text-anchor="middle">x + 3 = 7</text>
  <text x="120" y="115" font-family="Verdana" font-size="22" fill="#7c3aed" text-anchor="middle">x = 7 − 3 = 4</text>
`);

export const IMG_TRIANGLES = wrap(`
  <rect width="240" height="160" fill="#fffbeb"/>
  <polygon points="40,130 80,50 120,130" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
  <polygon points="120,130 150,70 180,130" fill="#fb923c" stroke="#b45309" stroke-width="2"/>
  <polygon points="160,130 220,130 220,70" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>
  <text x="80"  y="148" font-family="Verdana" font-size="10" fill="#78350f" text-anchor="middle">Equilateral</text>
  <text x="150" y="148" font-family="Verdana" font-size="10" fill="#78350f" text-anchor="middle">Isosceles</text>
  <text x="200" y="148" font-family="Verdana" font-size="10" fill="#78350f" text-anchor="middle">Right</text>
`);

export const IMG_TRIGONOMETRY = wrap(`
  <rect width="240" height="160" fill="#f0fdfa"/>
  <polygon points="50,130 200,130 50,40" fill="#a7f3d0" stroke="#065f46" stroke-width="2"/>
  <rect x="50" y="115" width="15" height="15" fill="none" stroke="#065f46" stroke-width="1.5"/>
  <text x="35"  y="90"  font-family="Verdana" font-size="12" fill="#065f46">opp</text>
  <text x="120" y="148" font-family="Verdana" font-size="12" fill="#065f46" text-anchor="middle">adj</text>
  <text x="135" y="80"  font-family="Verdana" font-size="12" fill="#065f46">hyp</text>
  <text x="180" y="125" font-family="Verdana" font-size="12" font-weight="bold" fill="#065f46">θ</text>
`);

// ─── Science (advanced) ──────────────────────────────────────────────────────

export const IMG_FORCE_MOTION = wrap(`
  <rect width="240" height="160" fill="#fef2f2"/>
  <line x1="20" y1="130" x2="220" y2="130" stroke="#92400e" stroke-width="3"/>
  <rect x="120" y="80" width="60" height="50" fill="#f87171" stroke="#7f1d1d" stroke-width="2"/>
  <line x1="60" y1="105" x2="115" y2="105" stroke="#7f1d1d" stroke-width="4"/>
  <polygon points="115,98 115,112 125,105" fill="#7f1d1d"/>
  <text x="80"  y="92" font-family="Verdana" font-size="12" font-weight="bold" fill="#7f1d1d">Force →</text>
  <text x="150" y="110" font-family="Verdana" font-size="14" font-weight="bold" fill="#fff" text-anchor="middle">m</text>
  <text x="120" y="155" font-family="Verdana" font-size="11" fill="#7f1d1d">F = m × a</text>
`);

export const IMG_CELLS = wrap(`
  <rect width="240" height="160" fill="#f0fdf4"/>
  <rect x="15" y="30" width="100" height="100" fill="#bbf7d0" stroke="#166534" stroke-width="3"/>
  <rect x="22" y="37" width="86" height="86" fill="#dcfce7" stroke="#166534" stroke-width="1"/>
  <circle cx="65" cy="80" r="14" fill="#16a34a"/>
  <ellipse cx="40" cy="55" rx="6" ry="4" fill="#15803d"/>
  <ellipse cx="90" cy="100" rx="6" ry="4" fill="#15803d"/>
  <text x="65" y="148" font-family="Verdana" font-size="11" fill="#166534" text-anchor="middle">Plant cell</text>
  <ellipse cx="180" cy="80" rx="55" ry="50" fill="#fecaca" stroke="#991b1b" stroke-width="2"/>
  <circle cx="180" cy="80" r="14" fill="#dc2626"/>
  <ellipse cx="155" cy="60" rx="5" ry="3" fill="#b91c1c"/>
  <ellipse cx="200" cy="100" rx="5" ry="3" fill="#b91c1c"/>
  <text x="180" y="148" font-family="Verdana" font-size="11" fill="#991b1b" text-anchor="middle">Animal cell</text>
`);

export const IMG_ACIDS_BASES = wrap(`
  <rect width="240" height="160" fill="#fff7ed"/>
  <text x="120" y="30" font-family="Verdana" font-size="13" font-weight="bold" fill="#7c2d12" text-anchor="middle">pH Scale</text>
  <defs>
    <linearGradient id="pHg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#dc2626"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect x="20" y="55" width="200" height="30" fill="url(#pHg)" stroke="#1f2937" stroke-width="1"/>
  <g font-family="Verdana" font-size="10" fill="#1f2937" text-anchor="middle">
    <text x="20" y="105">0</text><text x="120" y="105">7</text><text x="220" y="105">14</text>
  </g>
  <g font-family="Verdana" font-size="11" font-weight="bold" text-anchor="middle">
    <text x="50"  y="135" fill="#dc2626">Acidic</text>
    <text x="120" y="135" fill="#a16207">Neutral</text>
    <text x="190" y="135" fill="#1d4ed8">Basic</text>
  </g>
`);

// ─── English (advanced) ──────────────────────────────────────────────────────

export const IMG_TENSES = wrap(`
  <rect width="240" height="160" fill="#f5f3ff"/>
  <line x1="20" y1="80" x2="220" y2="80" stroke="#5b21b6" stroke-width="3"/>
  <polygon points="220,80 210,74 210,86" fill="#5b21b6"/>
  <circle cx="50"  cy="80" r="8" fill="#a78bfa"/>
  <circle cx="120" cy="80" r="8" fill="#7c3aed"/>
  <circle cx="190" cy="80" r="8" fill="#a78bfa"/>
  <g font-family="Verdana" font-size="12" font-weight="bold" fill="#4c1d95" text-anchor="middle">
    <text x="50"  y="60">Past</text>
    <text x="120" y="60">Present</text>
    <text x="190" y="60">Future</text>
  </g>
  <g font-family="Verdana" font-size="11" fill="#1f2937" text-anchor="middle">
    <text x="50"  y="115">wrote</text>
    <text x="120" y="115">writes</text>
    <text x="190" y="115">will write</text>
  </g>
`);

export const IMG_ACTIVE_PASSIVE = wrap(`
  <rect width="240" height="160" fill="#ecfeff"/>
  <text x="120" y="30" font-family="Verdana" font-size="12" font-weight="bold" fill="#155e75" text-anchor="middle">Active vs Passive</text>
  <g font-family="Verdana" font-size="11" fill="#0f172a">
    <text x="20" y="65">Active:  Riya writes a letter.</text>
    <text x="20" y="115">Passive: A letter is written by Riya.</text>
  </g>
  <line x1="60"  y1="72" x2="115" y2="72" stroke="#0e7490" stroke-width="2"/>
  <polygon points="115,68 115,76 122,72" fill="#0e7490"/>
  <line x1="170" y1="122" x2="115" y2="122" stroke="#be185d" stroke-width="2"/>
  <polygon points="115,118 115,126 108,122" fill="#be185d"/>
`);
