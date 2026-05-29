#!/usr/bin/env node
/* Regenera web/circuitos.data.js a partir de datos/circuitos.json (sin Python). */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const data = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'circuitos.json'), 'utf8'))
const out =
  '/* Generado desde datos/circuitos.json — NO editar a mano. */\n' +
  'window.CIRCUITOS = ' + JSON.stringify(data, null, 2) + ';\n'
fs.writeFileSync(path.join(RAIZ, 'web', 'circuitos.data.js'), out)
console.log('OK -> web/circuitos.data.js')
