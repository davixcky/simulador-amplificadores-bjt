// Auto-prueba del motor: compara BJT.solve() contra los valores canónicos de datos/circuitos.json
const fs = require("fs");
const path = require("path");
const BJT = require("../web/engine.js");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../datos/circuitos.json"), "utf8"));

let fails = 0;
function near(name, got, exp, tolRel) {
  tolRel = tolRel || 0.01; // 1 %
  const ok = Math.abs(got - exp) <= Math.abs(exp) * tolRel + 1e-12;
  if (!ok) { fails++; console.log(`  ✗ ${name}: obtenido ${got}, esperado ${exp}`); }
  else console.log(`  ✓ ${name}: ${got.toPrecision(5)} ≈ ${exp}`);
}

for (const c of data.circuitos) {
  console.log(`\n[${c.id}] ${c.nombre} (${c.topologia})`);
  const r = BJT.solve(Object.assign({ topologia: c.topologia }, c.componentes));
  near("IC", r.dc.IC, c.dc.IC);
  near("IE", r.dc.IE, c.dc.IE);
  near("re", r.dc.re, c.dc.re);
  near("VCE", r.dc.VCE, c.dc.VCE);
  near("Zo", r.ac.Zo, c.ac.Zo);
  near("Av", r.ac.Av, c.ac.Av, 0.02);
  near("Zi", r.ac.Zi, c.ac.Zi, 0.02);
}

console.log(fails === 0 ? "\n✅ Todas las pruebas pasaron." : `\n❌ ${fails} fallo(s).`);
process.exit(fails === 0 ? 0 : 1);
