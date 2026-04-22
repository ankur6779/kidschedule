// Lightweight inline SVG illustrations for Smart Study Zone topics.
// Stored as raw SVG markup so they work on both web (data: URI in <img>)
// and React Native (react-native-svg's SvgXml). No network dependency,
// each one is well under 1 KB.
//
// Convention:
//   - viewBox="0 0 240 160" so all illustrations share the same aspect.
//   - Keep palette friendly: warm / pastel.

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">${inner}</svg>`;

// ─── Basic · Math ─────────────────────────────────────────────────────────────

export const IMG_ADDITION = wrap(`
  <rect width="240" height="160" fill="#fef3c7"/>
  <g fill="#ef4444"><circle cx="35" cy="80" r="13"/><circle cx="65" cy="80" r="13"/></g>
  <text x="100" y="88" font-family="Verdana" font-size="32" font-weight="bold" fill="#1f2937" text-anchor="middle">+</text>
  <g fill="#22c55e"><circle cx="135" cy="68" r="13"/><circle cx="165" cy="68" r="13"/><circle cx="135" cy="96" r="13"/></g>
  <text x="205" y="88" font-family="Verdana" font-size="22" font-weight="bold" fill="#1f2937" text-anchor="middle">= 5</text>
`);

export const IMG_SUBTRACTION = wrap(`
  <rect width="240" height="160" fill="#fce7f3"/>
  <g fill="#ec4899">
    ${[0,1,2,3,4].map(i=>`<circle cx="${28+i*36}" cy="70" r="13"/>`).join("")}
  </g>
  <line x1="136" y1="55" x2="165" y2="90" stroke="#be185d" stroke-width="3"/>
  <line x1="165" y1="55" x2="136" y2="90" stroke="#be185d" stroke-width="3"/>
  <line x1="172" y1="55" x2="201" y2="90" stroke="#be185d" stroke-width="3"/>
  <line x1="201" y1="55" x2="172" y2="90" stroke="#be185d" stroke-width="3"/>
  <text x="120" y="120" font-family="Verdana" font-size="20" font-weight="bold" fill="#9d174d" text-anchor="middle">5 − 2 = 3</text>
`);

export const IMG_MULTIPLICATION = wrap(`
  <rect width="240" height="160" fill="#e0f2fe"/>
  <g fill="#0284c7">
    ${[0,1,2].map(r=>[0,1,2,3].map(c=>`<circle cx="${50+c*35}" cy="${40+r*35}" r="11"/>`).join("")).join("")}
  </g>
  <text x="200" y="90" font-family="Verdana" font-size="20" font-weight="bold" fill="#0c4a6e">3×4</text>
  <text x="200" y="115" font-family="Verdana" font-size="20" font-weight="bold" fill="#0c4a6e">=12</text>
`);

export const IMG_DIVISION = wrap(`
  <rect width="240" height="160" fill="#f0fdf4"/>
  <g fill="#16a34a">
    ${[0,1,2,3,4,5].map(i=>`<circle cx="${30+i*30}" cy="55" r="13"/>`).join("")}
  </g>
  <text x="120" y="100" font-family="Verdana" font-size="28" font-weight="bold" fill="#15803d" text-anchor="middle">6 ÷ 2 = 3</text>
  <text x="120" y="140" font-family="Verdana" font-size="12" fill="#166534" text-anchor="middle">Share equally into 2 groups</text>
`);

export const IMG_FRACTIONS = wrap(`
  <rect width="240" height="160" fill="#fef3c7"/>
  <circle cx="80" cy="80" r="55" fill="#fcd34d" stroke="#92400e" stroke-width="3"/>
  <path d="M80 80 L80 25 A55 55 0 0 1 135 80 Z" fill="#dc2626" stroke="#92400e" stroke-width="3"/>
  <line x1="80" y1="25" x2="80" y2="135" stroke="#92400e" stroke-width="3"/>
  <line x1="25" y1="80" x2="135" y2="80" stroke="#92400e" stroke-width="3"/>
  <text x="190" y="65" font-family="Verdana" font-size="32" font-weight="bold" fill="#dc2626" text-anchor="middle">1</text>
  <line x1="170" y1="74" x2="210" y2="74" stroke="#dc2626" stroke-width="3"/>
  <text x="190" y="108" font-family="Verdana" font-size="32" font-weight="bold" fill="#dc2626" text-anchor="middle">4</text>
`);

export const IMG_GEOMETRY_BASICS = wrap(`
  <rect width="240" height="160" fill="#fffbeb"/>
  <circle cx="40" cy="80" r="30" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>
  <text x="40" y="128" font-family="Verdana" font-size="10" fill="#92400e" text-anchor="middle">Circle</text>
  <rect x="90" y="50" width="55" height="55" fill="#a78bfa" stroke="#5b21b6" stroke-width="2"/>
  <text x="117" y="128" font-family="Verdana" font-size="10" fill="#4c1d95" text-anchor="middle">Square</text>
  <polygon points="185,48 215,105 155,105" fill="#34d399" stroke="#065f46" stroke-width="2"/>
  <text x="185" y="128" font-family="Verdana" font-size="10" fill="#065f46" text-anchor="middle">Triangle</text>
`);

export const IMG_CLOCK = wrap(`
  <rect width="240" height="160" fill="#eff6ff"/>
  <circle cx="120" cy="80" r="65" fill="#fff" stroke="#1d4ed8" stroke-width="4"/>
  <circle cx="120" cy="80" r="5" fill="#1d4ed8"/>
  <line x1="120" y1="80" x2="120" y2="28" stroke="#1d4ed8" stroke-width="4" stroke-linecap="round"/>
  <line x1="120" y1="80" x2="155" y2="80" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
  <g font-family="Verdana" font-size="13" font-weight="bold" fill="#1f2937" text-anchor="middle">
    <text x="120" y="22">12</text><text x="120" y="148">6</text>
    <text x="15" y="85">9</text><text x="225" y="85">3</text>
  </g>
`);

// ─── Basic · Science ─────────────────────────────────────────────────────────

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
  <g font-family="Verdana" font-size="10" fill="#0f172a">
    <text x="160" y="48">flower</text><text x="160" y="83">leaves</text>
    <text x="160" y="118">stem</text><text x="160" y="148">roots</text>
  </g>
`);

export const IMG_STATES_OF_MATTER = wrap(`
  <rect width="240" height="160" fill="#f0f9ff"/>
  <rect x="20"  y="40" width="55" height="80" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
  <rect x="32"  y="55" width="30" height="50" fill="#1d4ed8"/>
  <text x="47" y="140" font-family="Verdana" font-size="11" fill="#1d4ed8" text-anchor="middle">Solid</text>
  <rect x="92"  y="40" width="55" height="80" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
  <path d="M92 90 Q120 75 147 90 L147 120 L92 120 Z" fill="#3b82f6"/>
  <text x="120" y="140" font-family="Verdana" font-size="11" fill="#1d4ed8" text-anchor="middle">Liquid</text>
  <rect x="164" y="40" width="55" height="80" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
  <g fill="#60a5fa"><circle cx="180" cy="60" r="4"/><circle cx="200" cy="75" r="4"/>
    <circle cx="175" cy="95" r="4"/><circle cx="205" cy="105" r="4"/><circle cx="190" cy="85" r="4"/>
  </g>
  <text x="192" y="140" font-family="Verdana" font-size="11" fill="#1d4ed8" text-anchor="middle">Gas</text>
`);

export const IMG_ANIMALS_HABITAT = wrap(`
  <rect width="240" height="160" fill="#f0fdf4"/>
  <rect x="10" y="10" width="100" height="65" fill="#bbf7d0" stroke="#16a34a" stroke-width="2" rx="8"/>
  <text x="60" y="52" font-family="Verdana" font-size="30" text-anchor="middle">🐶🐱</text>
  <text x="60" y="78" font-family="Verdana" font-size="10" fill="#15803d" text-anchor="middle">Pet Animals</text>
  <rect x="130" y="10" width="100" height="65" fill="#d1fae5" stroke="#059669" stroke-width="2" rx="8"/>
  <text x="180" y="52" font-family="Verdana" font-size="30" text-anchor="middle">🦁🐘</text>
  <text x="180" y="78" font-family="Verdana" font-size="10" fill="#065f46" text-anchor="middle">Wild Animals</text>
  <rect x="10" y="90" width="100" height="60" fill="#fef9c3" stroke="#ca8a04" stroke-width="2" rx="8"/>
  <text x="60" y="128" font-family="Verdana" font-size="28" text-anchor="middle">🐄🐔</text>
  <text x="60" y="148" font-family="Verdana" font-size="10" fill="#713f12" text-anchor="middle">Farm Animals</text>
  <rect x="130" y="90" width="100" height="60" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" rx="8"/>
  <text x="180" y="128" font-family="Verdana" font-size="28" text-anchor="middle">🐟🐬</text>
  <text x="180" y="148" font-family="Verdana" font-size="10" fill="#0c4a6e" text-anchor="middle">Water Animals</text>
`);

export const IMG_HUMAN_BODY = wrap(`
  <rect width="240" height="160" fill="#fdf2f8"/>
  <circle cx="120" cy="28" r="18" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
  <rect x="108" y="48" width="24" height="40" fill="#fca5a5" stroke="#b91c1c" stroke-width="1.5" rx="4"/>
  <line x1="108" y1="55" x2="88" y2="75" stroke="#b91c1c" stroke-width="3" stroke-linecap="round"/>
  <line x1="132" y1="55" x2="152" y2="75" stroke="#b91c1c" stroke-width="3" stroke-linecap="round"/>
  <line x1="112" y1="88" x2="104" y2="125" stroke="#b91c1c" stroke-width="3" stroke-linecap="round"/>
  <line x1="128" y1="88" x2="136" y2="125" stroke="#b91c1c" stroke-width="3" stroke-linecap="round"/>
  <g font-family="Verdana" font-size="10" fill="#1f2937">
    <text x="148" y="22">Head</text><text x="148" y="60">Arms</text>
    <text x="148" y="85">Body</text><text x="148" y="125">Legs</text>
  </g>
`);

export const IMG_WEATHER = wrap(`
  <rect width="240" height="160" fill="#e0f2fe"/>
  <g text-anchor="middle" font-family="Verdana" font-size="11">
    <text x="45" y="58" font-size="34">☀️</text><text x="45" y="82">Summer</text>
    <text x="120" y="58" font-size="34">❄️</text><text x="120" y="82">Winter</text>
    <text x="195" y="58" font-size="34">🌧️</text><text x="195" y="82">Rainy</text>
    <text x="45"  y="128" font-size="34">🍂</text><text x="45" y="150">Autumn</text>
    <text x="120" y="128" font-size="34">🌸</text><text x="120" y="150">Spring</text>
    <text x="195" y="128" font-size="34">🌬️</text><text x="195" y="150">Windy</text>
  </g>
`);

export const IMG_FOOD_GROUPS = wrap(`
  <rect width="240" height="160" fill="#fffbeb"/>
  <rect x="10"  y="20" width="100" height="55" fill="#d1fae5" stroke="#059669" stroke-width="2" rx="8"/>
  <text x="60"  y="50" font-family="Verdana" font-size="28" text-anchor="middle">🥦🥕</text>
  <text x="60"  y="72" font-family="Verdana" font-size="10" fill="#065f46" text-anchor="middle">Vegetables</text>
  <rect x="130" y="20" width="100" height="55" fill="#fce7f3" stroke="#db2777" stroke-width="2" rx="8"/>
  <text x="180" y="50" font-family="Verdana" font-size="28" text-anchor="middle">🍎🍌</text>
  <text x="180" y="72" font-family="Verdana" font-size="10" fill="#9d174d" text-anchor="middle">Fruits</text>
  <rect x="10"  y="90" width="100" height="55" fill="#fef9c3" stroke="#ca8a04" stroke-width="2" rx="8"/>
  <text x="60"  y="120" font-family="Verdana" font-size="28" text-anchor="middle">🍞🥛</text>
  <text x="60"  y="142" font-family="Verdana" font-size="10" fill="#713f12" text-anchor="middle">Grains &amp; Dairy</text>
  <rect x="130" y="90" width="100" height="55" fill="#fee2e2" stroke="#dc2626" stroke-width="2" rx="8"/>
  <text x="180" y="120" font-family="Verdana" font-size="28" text-anchor="middle">🍗🥚</text>
  <text x="180" y="142" font-family="Verdana" font-size="10" fill="#7f1d1d" text-anchor="middle">Protein</text>
`);

// ─── Basic · English ─────────────────────────────────────────────────────────

export const IMG_NOUNS = wrap(`
  <rect width="240" height="160" fill="#fdf2f8"/>
  <text x="120" y="28" font-family="Verdana" font-size="13" font-weight="bold" fill="#9d174d" text-anchor="middle">Nouns — naming words</text>
  <g font-family="Verdana" font-size="34" text-anchor="middle">
    <text x="45" y="90">👧</text><text x="105" y="90">🏫</text>
    <text x="165" y="90">🐶</text><text x="218" y="90">📕</text>
  </g>
  <g font-family="Verdana" font-size="11" fill="#0f172a" text-anchor="middle">
    <text x="45" y="118">girl</text><text x="105" y="118">school</text>
    <text x="165" y="118">dog</text><text x="218" y="118">book</text>
  </g>
`);

export const IMG_VERBS = wrap(`
  <rect width="240" height="160" fill="#eff6ff"/>
  <text x="120" y="28" font-family="Verdana" font-size="13" font-weight="bold" fill="#1e40af" text-anchor="middle">Verbs — action words</text>
  <g font-family="Verdana" font-size="34" text-anchor="middle">
    <text x="45" y="90">🏃</text><text x="105" y="90">🍽️</text>
    <text x="165" y="90">🤸</text><text x="218" y="90">✍️</text>
  </g>
  <g font-family="Verdana" font-size="11" fill="#0f172a" text-anchor="middle">
    <text x="45" y="118">run</text><text x="105" y="118">eat</text>
    <text x="165" y="118">jump</text><text x="218" y="118">write</text>
  </g>
`);

export const IMG_ADJECTIVES = wrap(`
  <rect width="240" height="160" fill="#fdf4ff"/>
  <text x="120" y="25" font-family="Verdana" font-size="13" font-weight="bold" fill="#7e22ce" text-anchor="middle">Adjectives — describing words</text>
  <text x="70" y="75" font-family="Verdana" font-size="48" text-anchor="middle">🐘</text>
  <text x="70" y="108" font-family="Verdana" font-size="13" font-weight="bold" fill="#6b21a8" text-anchor="middle">BIG</text>
  <text x="175" y="88" font-family="Verdana" font-size="28" text-anchor="middle">🐭</text>
  <text x="175" y="108" font-family="Verdana" font-size="13" font-weight="bold" fill="#6b21a8" text-anchor="middle">small</text>
  <text x="120" y="145" font-family="Verdana" font-size="11" fill="#4a044e" text-anchor="middle">cold ice · hot sun · round ball</text>
`);

export const IMG_PRONOUNS = wrap(`
  <rect width="240" height="160" fill="#f0f9ff"/>
  <text x="120" y="25" font-family="Verdana" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">Pronouns replace nouns</text>
  <g font-family="Verdana" text-anchor="middle">
    <text x="40"  y="72" font-size="28">👦</text>
    <text x="40"  y="98" font-size="12" fill="#075985">He</text>
    <text x="100" y="72" font-size="28">👧</text>
    <text x="100" y="98" font-size="12" fill="#075985">She</text>
    <text x="160" y="72" font-size="28">👨‍👩‍👧</text>
    <text x="160" y="98" font-size="12" fill="#075985">They</text>
    <text x="215" y="72" font-size="28">👤</text>
    <text x="215" y="98" font-size="12" fill="#075985">I / We</text>
  </g>
  <text x="120" y="140" font-family="Verdana" font-size="11" fill="#0c4a6e" text-anchor="middle">It · You · We · They · He · She</text>
`);

export const IMG_SENTENCES = wrap(`
  <rect width="240" height="160" fill="#fefce8"/>
  <text x="120" y="25" font-family="Verdana" font-size="12" font-weight="bold" fill="#713f12" text-anchor="middle">A sentence has Subject + Verb</text>
  <rect x="15" y="40" width="60" height="35" fill="#fde68a" stroke="#d97706" stroke-width="2" rx="6"/>
  <text x="45" y="63" font-family="Verdana" font-size="12" font-weight="bold" fill="#713f12" text-anchor="middle">Riya</text>
  <rect x="90" y="40" width="60" height="35" fill="#bbf7d0" stroke="#16a34a" stroke-width="2" rx="6"/>
  <text x="120" y="63" font-family="Verdana" font-size="12" font-weight="bold" fill="#14532d" text-anchor="middle">reads</text>
  <rect x="165" y="40" width="60" height="35" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2" rx="6"/>
  <text x="195" y="63" font-family="Verdana" font-size="12" font-weight="bold" fill="#1e3a8a" text-anchor="middle">books.</text>
  <g font-family="Verdana" font-size="10" fill="#92400e" text-anchor="middle">
    <text x="45" y="95">Subject</text><text x="120" y="95">Verb</text><text x="195" y="95">Object</text>
  </g>
  <text x="120" y="140" font-family="Verdana" font-size="11" fill="#1f2937" text-anchor="middle">"Riya reads books." ✅</text>
`);

// ─── Advanced · Math ─────────────────────────────────────────────────────────

export const IMG_ALGEBRA = wrap(`
  <rect width="240" height="160" fill="#ede9fe"/>
  <text x="120" y="65" font-family="Verdana" font-size="28" font-weight="bold" fill="#5b21b6" text-anchor="middle">x + 3 = 7</text>
  <text x="120" y="108" font-family="Verdana" font-size="20" fill="#7c3aed" text-anchor="middle">x = 7 − 3 = 4</text>
`);

export const IMG_TRIANGLES = wrap(`
  <rect width="240" height="160" fill="#fffbeb"/>
  <polygon points="40,130 80,50 120,130" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
  <polygon points="120,130 150,70 180,130" fill="#fb923c" stroke="#b45309" stroke-width="2"/>
  <polygon points="160,130 220,130 220,70" fill="#fbbf24" stroke="#b45309" stroke-width="2"/>
  <g font-family="Verdana" font-size="9" fill="#78350f" text-anchor="middle">
    <text x="80"  y="148">Equilateral</text>
    <text x="150" y="148">Isosceles</text>
    <text x="195" y="148">Right</text>
  </g>
`);

export const IMG_TRIGONOMETRY = wrap(`
  <rect width="240" height="160" fill="#f0fdfa"/>
  <polygon points="50,130 200,130 50,40" fill="#a7f3d0" stroke="#065f46" stroke-width="2"/>
  <rect x="50" y="115" width="15" height="15" fill="none" stroke="#065f46" stroke-width="1.5"/>
  <g font-family="Verdana" font-size="11" fill="#065f46">
    <text x="30" y="90">opp</text><text x="118" y="148">adj</text>
    <text x="132" y="78">hyp</text><text x="178" y="124">θ</text>
  </g>
`);

export const IMG_QUADRATIC = wrap(`
  <rect width="240" height="160" fill="#fef2f2"/>
  <polyline points="20,145 40,100 60,65 80,40 100,25 120,20 140,25 160,40 180,65 200,100 220,145"
    fill="none" stroke="#dc2626" stroke-width="3"/>
  <line x1="20" y1="145" x2="220" y2="145" stroke="#1f2937" stroke-width="2"/>
  <line x1="120" y1="10"  x2="120" y2="150" stroke="#1f2937" stroke-width="2"/>
  <text x="120" y="155" font-family="Verdana" font-size="10" fill="#1f2937" text-anchor="middle">x</text>
  <text x="15" y="20" font-family="Verdana" font-size="10" fill="#1f2937">y</text>
  <text x="120" y="14" font-family="Verdana" font-size="11" font-weight="bold" fill="#7f1d1d" text-anchor="middle">ax²+bx+c = 0</text>
`);

export const IMG_STATISTICS = wrap(`
  <rect width="240" height="160" fill="#f0f9ff"/>
  <text x="120" y="18" font-family="Verdana" font-size="11" font-weight="bold" fill="#0c4a6e" text-anchor="middle">Bar Graph</text>
  <line x1="30" y1="130" x2="220" y2="130" stroke="#1f2937" stroke-width="2"/>
  <line x1="30" y1="20"  x2="30"  y2="132" stroke="#1f2937" stroke-width="2"/>
  <rect x="50"  y="90"  width="25" height="40" fill="#3b82f6"/>
  <rect x="90"  y="60"  width="25" height="70" fill="#22c55e"/>
  <rect x="130" y="45"  width="25" height="85" fill="#f59e0b"/>
  <rect x="170" y="75"  width="25" height="55" fill="#ec4899"/>
  <g font-family="Verdana" font-size="9" fill="#1f2937" text-anchor="middle">
    <text x="63"  y="143">Mon</text><text x="103" y="143">Tue</text>
    <text x="143" y="143">Wed</text><text x="183" y="143">Thu</text>
  </g>
`);

export const IMG_MENSURATION = wrap(`
  <rect width="240" height="160" fill="#fef9c3"/>
  <rect x="20" y="20" width="80" height="55" fill="#fde68a" stroke="#b45309" stroke-width="2"/>
  <text x="60" y="50" font-family="Verdana" font-size="11" font-weight="bold" fill="#713f12" text-anchor="middle">Rectangle</text>
  <text x="60" y="88" font-family="Verdana" font-size="10" fill="#713f12" text-anchor="middle">A = l × b</text>
  <circle cx="165" cy="50" r="35" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/>
  <text x="165" y="50" font-family="Verdana" font-size="11" font-weight="bold" fill="#14532d" text-anchor="middle">Circle</text>
  <text x="165" y="100" font-family="Verdana" font-size="10" fill="#14532d" text-anchor="middle">A = πr²</text>
  <polygon points="60,110 20,155 100,155" fill="#c7d2fe" stroke="#3730a3" stroke-width="2"/>
  <text x="60" y="148" font-family="Verdana" font-size="9" font-weight="bold" fill="#1e1b4b" text-anchor="middle">½ × b × h</text>
`);

export const IMG_LINEAR_EQ = wrap(`
  <rect width="240" height="160" fill="#f0fdf4"/>
  <line x1="20" y1="140" x2="220" y2="140" stroke="#1f2937" stroke-width="2"/>
  <line x1="20" y1="10"  x2="20"  y2="142" stroke="#1f2937" stroke-width="2"/>
  <line x1="20" y1="130" x2="220" y2="30"  stroke="#059669" stroke-width="3"/>
  <circle cx="120" cy="80" r="5" fill="#dc2626"/>
  <text x="130" y="76" font-family="Verdana" font-size="10" fill="#dc2626">(x₀,y₀)</text>
  <text x="120" y="18" font-family="Verdana" font-size="12" font-weight="bold" fill="#065f46" text-anchor="middle">y = mx + c</text>
  <text x="120" y="158" font-family="Verdana" font-size="10" fill="#1f2937" text-anchor="middle">m = slope · c = y-intercept</text>
`);

// ─── Advanced · Science ──────────────────────────────────────────────────────

export const IMG_FORCE_MOTION = wrap(`
  <rect width="240" height="160" fill="#fef2f2"/>
  <line x1="20" y1="130" x2="220" y2="130" stroke="#92400e" stroke-width="3"/>
  <rect x="120" y="80" width="60" height="50" fill="#f87171" stroke="#7f1d1d" stroke-width="2"/>
  <line x1="60" y1="105" x2="115" y2="105" stroke="#7f1d1d" stroke-width="4"/>
  <polygon points="115,98 115,112 125,105" fill="#7f1d1d"/>
  <text x="82"  y="92" font-family="Verdana" font-size="12" font-weight="bold" fill="#7f1d1d">Force →</text>
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
  <text x="65" y="148" font-family="Verdana" font-size="11" fill="#166534" text-anchor="middle">Plant Cell</text>
  <ellipse cx="180" cy="80" rx="55" ry="50" fill="#fecaca" stroke="#991b1b" stroke-width="2"/>
  <circle cx="180" cy="80" r="14" fill="#dc2626"/>
  <ellipse cx="155" cy="60" rx="5" ry="3" fill="#b91c1c"/>
  <ellipse cx="200" cy="100" rx="5" ry="3" fill="#b91c1c"/>
  <text x="180" y="148" font-family="Verdana" font-size="11" fill="#991b1b" text-anchor="middle">Animal Cell</text>
`);

export const IMG_ACIDS_BASES = wrap(`
  <rect width="240" height="160" fill="#fff7ed"/>
  <text x="120" y="28" font-family="Verdana" font-size="13" font-weight="bold" fill="#7c2d12" text-anchor="middle">pH Scale</text>
  <defs>
    <linearGradient id="pHg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#dc2626"/>
      <stop offset="50%"  stop-color="#facc15"/>
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

export const IMG_ELECTRICITY = wrap(`
  <rect width="240" height="160" fill="#fefce8"/>
  <rect x="20"  y="65" width="40" height="30" fill="#fde68a" stroke="#b45309" stroke-width="2" rx="4"/>
  <text x="40"  y="85" font-family="Verdana" font-size="10" fill="#713f12" text-anchor="middle">Battery</text>
  <rect x="175" y="65" width="40" height="30" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2" rx="4"/>
  <text x="195" y="85" font-family="Verdana" font-size="10" fill="#1e3a8a" text-anchor="middle">Bulb 💡</text>
  <line x1="60"  y1="80" x2="175" y2="80" stroke="#1f2937" stroke-width="2"/>
  <line x1="20"  y1="80" x2="20"  y2="140" stroke="#1f2937" stroke-width="2"/>
  <line x1="20"  y1="140" x2="215" y2="140" stroke="#1f2937" stroke-width="2"/>
  <line x1="215" y1="140" x2="215" y2="95" stroke="#1f2937" stroke-width="2"/>
  <polygon points="115,72 107,80 115,88" fill="#f59e0b"/>
  <text x="120" y="68" font-family="Verdana" font-size="9" fill="#92400e" text-anchor="middle">→ current</text>
  <text x="120" y="155" font-family="Verdana" font-size="10" fill="#1f2937" text-anchor="middle">V = I × R  (Ohm's Law)</text>
`);

export const IMG_DIGESTIVE = wrap(`
  <rect width="240" height="160" fill="#fff7ed"/>
  <text x="120" y="18" font-family="Verdana" font-size="11" font-weight="bold" fill="#7c2d12" text-anchor="middle">Digestive System</text>
  <ellipse cx="120" cy="38" rx="20" ry="12" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
  <text x="148" y="42" font-family="Verdana" font-size="9" fill="#713f12">Mouth</text>
  <rect x="108" y="50" width="24" height="22" fill="#fca5a5" stroke="#b91c1c" stroke-width="1.5" rx="3"/>
  <text x="148" y="64" font-family="Verdana" font-size="9" fill="#713f12">Oesophagus</text>
  <ellipse cx="120" cy="90" rx="28" ry="20" fill="#fdba74" stroke="#ea580c" stroke-width="2"/>
  <text x="148" y="94" font-family="Verdana" font-size="9" fill="#713f12">Stomach</text>
  <path d="M100 110 Q80 130 100 145 Q120 155 140 145 Q160 130 140 110 Q120 120 100 110" fill="#a7f3d0" stroke="#059669" stroke-width="2"/>
  <text x="148" y="138" font-family="Verdana" font-size="9" fill="#065f46">Intestine</text>
`);

export const IMG_LIGHT_OPTICS = wrap(`
  <rect width="240" height="160" fill="#f0fdf4"/>
  <text x="120" y="18" font-family="Verdana" font-size="11" font-weight="bold" fill="#065f46" text-anchor="middle">Reflection of Light</text>
  <line x1="20" y1="30" x2="120" y2="100" stroke="#f59e0b" stroke-width="3"/>
  <polygon points="120,100 110,92 118,104" fill="#f59e0b"/>
  <line x1="120" y1="20"  x2="120" y2="140" stroke="#9ca3af" stroke-width="1" stroke-dasharray="5,4"/>
  <line x1="120" y1="100" x2="220" y2="30" stroke="#3b82f6" stroke-width="3"/>
  <polygon points="220,30 208,34 215,42" fill="#3b82f6"/>
  <line x1="20" y1="100" x2="220" y2="100" stroke="#1f2937" stroke-width="3"/>
  <text x="55"  y="65" font-family="Verdana" font-size="9" fill="#b45309">Incident</text>
  <text x="155" y="65" font-family="Verdana" font-size="9" fill="#1d4ed8">Reflected</text>
  <text x="120" y="120" font-family="Verdana" font-size="9" fill="#374151" text-anchor="middle">∠i = ∠r</text>
`);

// ─── Advanced · English ──────────────────────────────────────────────────────

export const IMG_TENSES = wrap(`
  <rect width="240" height="160" fill="#f5f3ff"/>
  <line x1="20" y1="80" x2="220" y2="80" stroke="#5b21b6" stroke-width="3"/>
  <polygon points="220,80 210,74 210,86" fill="#5b21b6"/>
  <circle cx="50"  cy="80" r="8" fill="#a78bfa"/>
  <circle cx="120" cy="80" r="8" fill="#7c3aed"/>
  <circle cx="190" cy="80" r="8" fill="#a78bfa"/>
  <g font-family="Verdana" font-size="11" font-weight="bold" fill="#4c1d95" text-anchor="middle">
    <text x="50"  y="62">Past</text><text x="120" y="62">Present</text><text x="190" y="62">Future</text>
  </g>
  <g font-family="Verdana" font-size="10" fill="#1f2937" text-anchor="middle">
    <text x="50" y="112">wrote</text><text x="120" y="112">writes</text><text x="190" y="112">will write</text>
  </g>
`);

export const IMG_ACTIVE_PASSIVE = wrap(`
  <rect width="240" height="160" fill="#ecfeff"/>
  <text x="120" y="28" font-family="Verdana" font-size="12" font-weight="bold" fill="#155e75" text-anchor="middle">Active vs Passive Voice</text>
  <g font-family="Verdana" font-size="11" fill="#0f172a">
    <text x="20" y="65">Active:  Riya writes a letter.</text>
    <text x="20" y="115">Passive: A letter is written by Riya.</text>
  </g>
  <line x1="60"  y1="72" x2="115" y2="72" stroke="#0e7490" stroke-width="2"/>
  <polygon points="115,68 115,76 122,72" fill="#0e7490"/>
  <line x1="170" y1="122" x2="115" y2="122" stroke="#be185d" stroke-width="2"/>
  <polygon points="115,118 115,126 108,122" fill="#be185d"/>
`);

export const IMG_PREPOSITIONS = wrap(`
  <rect width="240" height="160" fill="#fef9c3"/>
  <text x="120" y="22" font-family="Verdana" font-size="12" font-weight="bold" fill="#713f12" text-anchor="middle">Prepositions of Place</text>
  <rect x="90" y="90" width="60" height="40" fill="#fde68a" stroke="#d97706" stroke-width="2" rx="4"/>
  <text x="120" y="116" font-family="Verdana" font-size="11" fill="#713f12" text-anchor="middle">Box</text>
  <text x="120" y="70" font-family="Verdana" font-size="18" text-anchor="middle">🐱</text>
  <text x="120" y="86" font-family="Verdana" font-size="10" fill="#ea580c" text-anchor="middle">ON the box</text>
  <text x="35"  y="116" font-family="Verdana" font-size="18" text-anchor="middle">🐱</text>
  <text x="35"  y="135" font-family="Verdana" font-size="9" fill="#ea580c" text-anchor="middle">NEXT TO</text>
  <text x="205" y="116" font-family="Verdana" font-size="14" text-anchor="middle">🐱</text>
  <text x="205" y="135" font-family="Verdana" font-size="9" fill="#ea580c" text-anchor="middle">BEHIND</text>
`);

export const IMG_REPORTED_SPEECH = wrap(`
  <rect width="240" height="160" fill="#fdf4ff"/>
  <text x="120" y="22" font-family="Verdana" font-size="11" font-weight="bold" fill="#7e22ce" text-anchor="middle">Direct vs Indirect Speech</text>
  <rect x="10" y="35" width="215" height="35" fill="#e9d5ff" stroke="#7c3aed" stroke-width="2" rx="6"/>
  <text x="18" y="57" font-family="Verdana" font-size="10" fill="#3b0764">Direct: She said, "I am happy."</text>
  <polygon points="120,90 110,80 130,80" fill="#7c3aed"/>
  <rect x="10" y="95" width="215" height="35" fill="#d1fae5" stroke="#059669" stroke-width="2" rx="6"/>
  <text x="18" y="117" font-family="Verdana" font-size="10" fill="#065f46">Indirect: She said that she was happy.</text>
  <text x="120" y="152" font-family="Verdana" font-size="10" fill="#1f2937" text-anchor="middle">Tense shifts back one step ↓</text>
`);
