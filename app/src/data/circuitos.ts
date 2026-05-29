/*
 * circuitos.ts — Acceso tipado a los datos canónicos de circuitos.
 *
 * NOTA: ./circuitos.json es una copia que refleja /datos/circuitos.json
 * (la ÚNICA fuente de verdad del proyecto). No edites la copia a mano;
 * mantenla sincronizada con /datos/circuitos.json.
 *
 * Como JSON no admite comentarios, la nota de procedencia vive aquí.
 */
import datosJson from './circuitos.json'
import type { DatosCircuitos } from '../types/circuitos'

// El JSON tipa 'topologia' como string; lo afirmamos al union vía unknown.
const datos = datosJson as unknown as DatosCircuitos

export const META = datos.meta
export const CIRCUITOS = datos.circuitos

export default datos
