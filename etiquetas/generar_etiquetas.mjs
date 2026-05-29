#!/usr/bin/env node
/*
 * Generador de etiquetas imprimibles Niimbot — versión Node (sin Python).
 *
 * Lee datos/circuitos.json (única fuente de verdad) y produce
 * etiquetas/etiquetas-bjt.pdf con pdfkit:
 *   - Página EXACTA de 50 mm × 30 mm (141.732 × 85.039 pt).
 *   - Un circuito por página (3 páginas).
 *   - Solo negro puro sobre blanco. Reglas de 0.7 pt (sin hairlines).
 *   - Ecuaciones de una línea "lhs = rhs = val" con subíndices X_Y.
 *   - Medición de ancho real (widthOfString) y auto-ajuste del tamaño de fuente
 *     para garantizar que NADA se sale de los márgenes.
 *
 * Fuente DejaVu Sans embebida (etiquetas/fonts/) por su cobertura de glifos
 * técnicos (β, ∞, ∥, ≈, Ω, µ, signo menos U+2212), igual que la versión previa.
 *
 * Uso:  node etiquetas/generar_etiquetas.mjs   (o: npm run etiquetas)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.dirname(AQUI)
const JSON_PATH = path.join(RAIZ, 'datos', 'circuitos.json')
const PDF_PATH = path.join(AQUI, 'etiquetas-bjt.pdf')
const REG_PATH = path.join(AQUI, 'fonts', 'DejaVuSans.ttf')
const BOLD_PATH = path.join(AQUI, 'fonts', 'DejaVuSans-Bold.ttf')

// --- Página (impresora térmica Niimbot): 50 mm × 30 mm -----------------------
const PAGE_W = (50 / 25.4) * 72.0 // 141.732 pt
const PAGE_H = (30 / 25.4) * 72.0 //  85.039 pt
const MARGEN = 2.5
const X0 = MARGEN
const X1 = PAGE_W - MARGEN
const USABLE_W = X1 - X0
const USABLE_H = PAGE_H - 2 * MARGEN

const RULE_W = 0.7
const SUB_FRAC = 0.72 // tamaño del subíndice relativo al cuerpo
const SUB_DROP = 0.18 // cuánto baja el subíndice (fracción del cuerpo)
const LEADING = 1.15

const FREG = 'reg'
const FBOLD = 'bold'

// --- Normalización de glifos -------------------------------------------------
function normaliza(s) {
  if (s == null) return ''
  return String(s).replace(/ /g, ' ').replace(/ /g, ' ')
}

// Dónde termina un subíndice X_Y.
const SEP_SUB = new Set([...' ()/+−-·*=,∥≈≥∞'])

// Tokeniza "X_Y" en runs [texto, esSub], aplanando subíndices.
function tokeniza(texto) {
  texto = normaliza(texto)
  const runs = []
  let buf = ''
  let i = 0
  const n = texto.length
  while (i < n) {
    const c = texto[i]
    if (c === '_' && i + 1 < n) {
      if (buf) { runs.push([buf, false]); buf = '' }
      let j = i + 1
      if (texto[j] === '(') {
        const k = texto.indexOf(')', j)
        if (k !== -1) {
          runs.push([texto.slice(j + 1, k), true])
          i = k + 1
          continue
        }
      }
      let sub = ''
      while (j < n && !SEP_SUB.has(texto[j]) && texto[j] !== '_') { sub += texto[j]; j++ }
      if (sub) runs.push([sub, true])
      i = j
    } else {
      buf += c
      i++
    }
  }
  if (buf) runs.push([buf, false])
  return runs
}

// --- Medición de ancho (mide siempre con la regular, como la versión previa) --
function anchoRuns(doc, runs, size) {
  let w = 0
  doc.font(FREG)
  for (const [txt, esSub] of runs) {
    const fs = esSub ? size * SUB_FRAC : size
    doc.fontSize(fs)
    w += doc.widthOfString(txt)
  }
  return w
}

// --- Formato de componentes --------------------------------------------------
function g(x) {
  // Equivalente a "{x:g}": quita ceros sobrantes.
  return String(parseFloat(Number(x).toPrecision(6)))
}
function fmtR(ohm) {
  const k = ohm / 1000
  return (Math.abs(k - Math.round(k)) < 1e-6 ? String(Math.round(k)) : g(k)) + 'kΩ'
}
function fmtC(far) { return g(far * 1e6) + 'µF' }

function lineaDatos(comp) {
  const partes = []
  if ('VCC' in comp) partes.push(`V_CC=${g(comp.VCC)}V`)
  for (const [clave, etiq] of [['R1', 'R_1'], ['R2', 'R_2'], ['RB', 'R_B'], ['RF', 'R_F'], ['RC', 'R_C'], ['RE', 'R_E']]) {
    if (clave in comp) partes.push(`${etiq}=${fmtR(comp[clave])}`)
  }
  if ('beta' in comp) partes.push(`β=${g(comp.beta)}`)
  for (const [clave, etiq] of [['C_in', 'C_in'], ['C_out', 'C_out'], ['C_E', 'C_E']]) {
    if (clave in comp) partes.push(`${etiq}=${fmtC(comp[clave])}`)
  }
  return partes.join(' · ')
}

// "lhs <rel> rhs = val" omitiendo subst; detecta operador relacional en rhs.
function ecuacion(eq) {
  const lhs = normaliza(eq.lhs || '')
  let rhsRaw = (eq.rhs || '').replace(/^\s+/, '')
  const val = normaliza(eq.val || '')
  let rel = '='
  for (const sym of ['≈', '≤', '≥', '<', '>']) {
    if (rhsRaw.startsWith(sym)) { rel = sym; rhsRaw = rhsRaw.slice(sym.length).trim(); break }
  }
  return `${lhs} ${rel} ${normaliza(rhsRaw)} = ${val}`
}

// --- Items de cada etiqueta --------------------------------------------------
function construyeItems(cir) {
  const items = []
  items.push({ tipo: 'titulo', texto: normaliza(cir.nombre) })
  const subt = normaliza(cir.subtitulo || '')
  if (subt) items.push({ tipo: 'subtitulo', texto: subt })
  items.push({ tipo: 'regla' })
  items.push({ tipo: 'etiqueta', texto: 'Datos: ' + lineaDatos(cir.componentes) })
  items.push({ tipo: 'encabezado', texto: 'DC:' })
  for (const eq of cir.ecuaciones_dc || []) items.push({ tipo: 'ecu', texto: ecuacion(eq) })
  items.push({ tipo: 'regla' })
  items.push({ tipo: 'encabezado', texto: 'AC:' })
  for (const eq of cir.ecuaciones_ac || []) items.push({ tipo: 'ecu', texto: ecuacion(eq) })
  items.push({ tipo: 'recordatorio', texto: 'recordatorio: r_e = 26mV / I_E' })
  return items
}

function sizeDe(item, body) {
  switch (item.tipo) {
    case 'titulo': return [body + 1.4, true]
    case 'subtitulo': return [body - 0.2, false]
    case 'encabezado': return [body, true]
    default: return [body, false]
  }
}

// Divide runs en líneas que quepan en maxW (corte en límites de palabra).
function envuelve(doc, runs, size, maxW) {
  const palabras = []
  let actual = []
  for (const [txt, esSub] of runs) {
    if (esSub) { actual.push([txt, true]); continue }
    for (const tr of txt.split(/(\s+)/)) {
      if (tr === '') continue
      if (tr.trim() === '') { if (actual.length) { palabras.push(actual); actual = [] } }
      else actual.push([tr, false])
    }
  }
  if (actual.length) palabras.push(actual)

  doc.font(FREG).fontSize(size)
  const spaceW = doc.widthOfString(' ')
  const lineas = []
  let cur = []
  let curW = 0
  for (const pal of palabras) {
    const pw = anchoRuns(doc, pal, size)
    const extra = cur.length ? spaceW : 0
    if (cur.length && curW + extra + pw > maxW) {
      lineas.push(cur); cur = [...pal]; curW = pw
    } else {
      if (cur.length) { cur.push([' ', false]); curW += spaceW }
      cur.push(...pal); curW += pw
    }
  }
  if (cur.length) lineas.push(cur)
  return lineas.length ? lineas : [[['', false]]]
}

// Maqueta a un cuerpo dado: devuelve {cabe, alto, render}.
function maqueta(doc, items, body) {
  const render = []
  let alto = 0
  let maxOverflow = 0
  for (const item of items) {
    if (item.tipo === 'regla') {
      alto += body * 0.55
      render.push({ kind: 'rule' })
      alto += body * 0.30
      continue
    }
    const [size, bold] = sizeDe(item, body)
    const runs = tokeniza(item.texto)
    const lineas = envuelve(doc, runs, size, USABLE_W)
    for (const ln of lineas) {
      const w = anchoRuns(doc, ln, size)
      if (w > USABLE_W) maxOverflow = Math.max(maxOverflow, w - USABLE_W)
    }
    for (const ln of lineas) {
      render.push({ kind: 'text', tipo: item.tipo, runs: ln, size, bold })
      alto += size * LEADING
    }
    if (item.tipo === 'titulo') alto += body * 0.10
  }
  const cabe = alto <= USABLE_H && maxOverflow <= 0.01
  return { cabe, alto, render }
}

// Dibuja una etiqueta cuyo borde superior está en originY (coords pdfkit, y↓).
function dibujaEtiqueta(doc, items, originY) {
  let body = 4.4
  let render = null
  while (body >= 2.6) {
    const m = maqueta(doc, items, body)
    if (m.cabe) { render = m.render; break }
    body -= 0.05
  }
  if (!render) { render = maqueta(doc, items, 2.6).render; body = 2.6 }

  doc.fillColor('black').strokeColor('black')
  let y = originY + MARGEN // cursor de baseline (y crece hacia abajo)
  for (const el of render) {
    if (el.kind === 'rule') {
      y += body * 0.55
      doc.lineWidth(RULE_W).lineCap('butt').moveTo(X0, y).lineTo(X1, y).stroke()
      y += body * 0.30
      continue
    }
    const size = el.size
    y += size // baja al baseline de esta línea
    const font = el.bold ? FBOLD : FREG
    let cx = X0
    for (const [txt, esSub] of el.runs) {
      if (esSub) {
        const fsz = size * SUB_FRAC
        doc.font(font).fontSize(fsz).text(txt, cx, y + size * SUB_DROP, { baseline: 'alphabetic', lineBreak: false })
        cx += doc.widthOfString(txt)
      } else {
        doc.font(font).fontSize(size).text(txt, cx, y, { baseline: 'alphabetic', lineBreak: false })
        cx += doc.widthOfString(txt)
      }
    }
    y += size * (LEADING - 1.0)
    if (el.tipo === 'titulo') y += body * 0.10
  }
  return body
}

const HOJA_PATH = path.join(AQUI, 'etiquetas-hoja.pdf') // hoja de contacto (3 apiladas)
const GAP = 8 // separación entre etiquetas en la hoja de contacto (pt)

function escribe(doc, ruta) {
  return new Promise((resolve) => {
    const s = fs.createWriteStream(ruta)
    doc.pipe(s)
    doc.end()
    s.on('finish', resolve)
  })
}

// --- Main --------------------------------------------------------------------
async function main() {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
  const circuitos = data.circuitos

  // (1) PDF de etiquetas: una por página (50×30 mm).
  const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0, autoFirstPage: false })
  doc.registerFont(FREG, REG_PATH)
  doc.registerFont(FBOLD, BOLD_PATH)
  doc.info.Title = 'Etiquetas BJT - amplificadores'
  for (const cir of circuitos) {
    doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 })
    const body = dibujaEtiqueta(doc, construyeItems(cir), 0)
    process.stderr.write(`  [${cir.id}] ${cir.nombre}: cuerpo=${body.toFixed(2)} pt\n`)
  }
  await escribe(doc, PDF_PATH)
  console.log(`OK -> ${PDF_PATH}  (${circuitos.length} páginas, ${PAGE_W.toFixed(3)} x ${PAGE_H.toFixed(3)} pt)`)

  // (2) Hoja de contacto: las 3 etiquetas apiladas en una página, con separadores
  //     negros sobre blanco. Sirve para previsualizar todas a la vez (preview-todas).
  const hojaH = PAGE_H * circuitos.length + GAP * (circuitos.length - 1)
  const hoja = new PDFDocument({ size: [PAGE_W, hojaH], margin: 0, autoFirstPage: true })
  hoja.registerFont(FREG, REG_PATH)
  hoja.registerFont(FBOLD, BOLD_PATH)
  circuitos.forEach((cir, k) => {
    const originY = k * (PAGE_H + GAP)
    dibujaEtiqueta(hoja, construyeItems(cir), originY)
    if (k < circuitos.length - 1) {
      const yy = originY + PAGE_H + GAP / 2
      hoja.lineWidth(0.7).strokeColor('black').moveTo(0, yy).lineTo(PAGE_W, yy).stroke()
    }
  })
  await escribe(hoja, HOJA_PATH)
  console.log(`OK -> ${HOJA_PATH}  (hoja de contacto, ${PAGE_W.toFixed(3)} x ${hojaH.toFixed(3)} pt)`)
}

main()
