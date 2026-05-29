#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de etiquetas imprimibles para impresora termica Niimbot.

Lee los valores canonicos desde datos/circuitos.json (unica fuente de verdad)
y produce etiquetas/etiquetas-bjt.pdf:
  - Pagina EXACTA de 50 mm x 30 mm (141.732 x 85.039 pt).
  - Un circuito por pagina (3 paginas).
  - Solo negro puro sobre blanco. Reglas de 0.6-0.8 pt. Sin hairlines.
  - Ecuaciones de una sola linea "lhs = rhs = val" con subindices X_Y.
  - Dibujo manual con medicion de ancho (stringWidth) y auto-ajuste de
    tamano de fuente para garantizar que NADA se sale de los margenes.

Fuente: DejaVu Sans (TrueType, embebida) por su cobertura completa de
glifos tecnicos (beta, inf, ||, ~~, >=, ohm, micro, signo menos U+2212),
que la Helvetica Type1 estandar no renderiza de forma fiable.
"""

import json
import os
import re
import sys

from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import stringWidth

# ----------------------------------------------------------------------------
# Rutas
# ----------------------------------------------------------------------------
AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
JSON_PATH = os.path.join(RAIZ, "datos", "circuitos.json")
PDF_PATH = os.path.join(AQUI, "etiquetas-bjt.pdf")

# ----------------------------------------------------------------------------
# Pagina (impresora termica Niimbot): 50 mm x 30 mm
# ----------------------------------------------------------------------------
PAGE_W = 50 / 25.4 * 72.0   # = 141.732 pt
PAGE_H = 30 / 25.4 * 72.0   # =  85.039 pt
PAGESIZE = (PAGE_W, PAGE_H)

MARGEN = 2.5                # margen ~2.5 pt (deja holgura para el bearing)
X0 = MARGEN
X1 = PAGE_W - MARGEN
USABLE_W = X1 - X0          # ~137.73 pt
TOP = PAGE_H - MARGEN

RULE_W = 0.7                # grosor de regla (>= 0.5 pt, sin hairlines)
SUB_FRAC = 0.72             # tamano del subindice relativo al cuerpo
SUB_DROP = 0.18             # cuanto baja el subindice (fraccion del tamano)
LEADING = 1.15              # interlineado

# ----------------------------------------------------------------------------
# Fuentes Unicode embebidas (DejaVu Sans regular + bold)
# ----------------------------------------------------------------------------
def _localizar_fuente(nombres):
    candidatos = []
    try:
        import matplotlib
        mpl = os.path.join(os.path.dirname(matplotlib.__file__),
                           "mpl-data", "fonts", "ttf")
        candidatos.append(mpl)
    except Exception:
        pass
    candidatos += [
        "/usr/share/fonts/dejavu",
        "/usr/share/fonts/truetype/dejavu",
        "/usr/share/fonts/TTF",
    ]
    for d in candidatos:
        for n in nombres:
            p = os.path.join(d, n)
            if os.path.isfile(p):
                return p
    return None

REG_PATH = _localizar_fuente(["DejaVuSans.ttf"])
BOLD_PATH = _localizar_fuente(["DejaVuSans-Bold.ttf"])
if not REG_PATH or not BOLD_PATH:
    sys.exit("ERROR: no se encontro DejaVuSans.ttf / DejaVuSans-Bold.ttf")

FONT = "DejaVuSans"
FONT_B = "DejaVuSans-Bold"
pdfmetrics.registerFont(TTFont(FONT, REG_PATH))
pdfmetrics.registerFont(TTFont(FONT_B, BOLD_PATH))

# ----------------------------------------------------------------------------
# Saneado / normalizacion de glifos
# ----------------------------------------------------------------------------
# DejaVu Sans soporta todos estos; aun asi normalizamos espacios raros.
def normaliza(s):
    if s is None:
        return ""
    s = s.replace(" ", " ")   # nbsp -> espacio normal
    s = s.replace(" ", " ")   # thin space
    return s

# ----------------------------------------------------------------------------
# Tokenizacion en "runs": (texto, es_subindice)
# Convierte "X_Y" en X con Y como subindice. El subindice abarca hasta el
# proximo separador (espacio, operador o parentesis).
# ----------------------------------------------------------------------------
SEP_SUB = set(" ()/+−-·*=,∥≈≥∞")  # donde termina un subindice

def tokeniza(texto):
    """Devuelve lista de runs [(texto, es_sub)] aplanando los subindices X_Y."""
    texto = normaliza(texto)
    runs = []
    buf = []          # texto base acumulado
    i = 0
    n = len(texto)
    while i < n:
        c = texto[i]
        if c == "_" and i + 1 < n:
            # cierra base pendiente
            if buf:
                runs.append(("".join(buf), False))
                buf = []
            # toma el subindice hasta el proximo separador
            j = i + 1
            # caso "X_(...)" -> subindice = contenido entre parentesis
            if texto[j] == "(":
                k = texto.find(")", j)
                if k != -1:
                    sub = texto[j + 1:k]
                    runs.append((sub, True))
                    i = k + 1
                    continue
            sub_chars = []
            while j < n and texto[j] not in SEP_SUB and texto[j] != "_":
                sub_chars.append(texto[j])
                j += 1
            if sub_chars:
                runs.append(("".join(sub_chars), True))
            i = j
        else:
            buf.append(c)
            i += 1
    if buf:
        runs.append(("".join(buf), False))
    return runs

def ancho_runs(runs, size):
    """Ancho total en pt de una lista de runs a un tamano de cuerpo dado."""
    w = 0.0
    for txt, es_sub in runs:
        fs = size * SUB_FRAC if es_sub else size
        w += stringWidth(txt, FONT, fs)
    return w

def dibuja_runs(c, x, y_base, runs, size):
    """Dibuja runs (con subindices) empezando en x; devuelve x final."""
    cx = x
    for txt, es_sub in runs:
        if es_sub:
            fs = size * SUB_FRAC
            c.setFont(FONT, fs)
            c.drawString(cx, y_base - size * SUB_DROP, txt)
            cx += stringWidth(txt, FONT, fs)
        else:
            c.setFont(FONT, size)
            c.drawString(cx, y_base, txt)
            cx += stringWidth(txt, FONT, size)
    return cx

# ----------------------------------------------------------------------------
# Construccion de las lineas de texto de cada etiqueta
# ----------------------------------------------------------------------------
def fmt_R(ohmios):
    """Resistencia en kohm con etiqueta compacta."""
    k = ohmios / 1000.0
    if abs(k - round(k)) < 1e-6:
        return f"{int(round(k))}kΩ"            # 4k ohm
    return f"{k:g}kΩ"

def fmt_C(faradios):
    return f"{faradios * 1e6:g}µF"             # micro F

def linea_datos(comp):
    """Construye la cadena 'Datos:' a partir de .componentes (kohm/uF/V/beta)."""
    partes = []
    # VCC primero
    if "VCC" in comp:
        partes.append(f"V_CC={comp['VCC']:g}V")
    # Resistencias en orden estable conocido
    for clave, etiq in [("R1", "R_1"), ("R2", "R_2"), ("RB", "R_B"),
                        ("RF", "R_F"), ("RC", "R_C"), ("RE", "R_E")]:
        if clave in comp:
            partes.append(f"{etiq}={fmt_R(comp[clave])}")
    if "beta" in comp:
        partes.append(f"β={comp['beta']:g}")
    # Condensadores
    for clave, etiq in [("C_in", "C_in"), ("C_out", "C_out"), ("C_E", "C_E")]:
        if clave in comp:
            partes.append(f"{etiq}={fmt_C(comp[clave])}")
    return " · ".join(partes)

def ecuacion(eq):
    """'lhs <rel> rhs = val' OMITIENDO subst. Detecta un operador relacional
    (≈, ≤, ≥, <, >) al inicio de rhs para no duplicar el '='."""
    lhs = normaliza(eq.get("lhs", ""))
    rhs_raw = eq.get("rhs", "").lstrip()
    val = normaliza(eq.get("val", ""))
    rel = "="
    for sym in ("≈", "≤", "≥", "<", ">"):
        if rhs_raw.startswith(sym):
            rel = sym
            rhs_raw = rhs_raw[len(sym):].strip()
            break
    rhs = normaliza(rhs_raw)
    return f"{lhs} {rel} {rhs} = {val}"

# Cada item es un dict que describe como dibujarlo.
# tipo: 'titulo' | 'regla' | 'etiqueta' | 'texto'
def construye_items(cir):
    items = []
    nombre = normaliza(cir["nombre"])
    subt = normaliza(cir.get("subtitulo", ""))
    items.append({"tipo": "titulo", "texto": nombre})
    if subt:
        items.append({"tipo": "subtitulo", "texto": subt})
    items.append({"tipo": "regla"})

    items.append({"tipo": "etiqueta", "texto": "Datos: " + linea_datos(cir["componentes"])})

    items.append({"tipo": "encabezado", "texto": "DC:"})
    for eq in cir.get("ecuaciones_dc", []):
        items.append({"tipo": "ecu", "texto": ecuacion(eq)})

    items.append({"tipo": "regla"})

    items.append({"tipo": "encabezado", "texto": "AC:"})
    for eq in cir.get("ecuaciones_ac", []):
        items.append({"tipo": "ecu", "texto": ecuacion(eq)})

    # recordatorio re = 26mV / IE
    items.append({"tipo": "recordatorio", "texto": "recordatorio: r_e = 26mV / I_E"})
    return items

# ----------------------------------------------------------------------------
# Medicion: dado un tamano base de cuerpo, calcula la altura total y si toda
# linea cabe en USABLE_W (envolviendo si hace falta). Devuelve (cabe, alto,
# lineas_render) donde lineas_render es lista de (item, runs).
# ----------------------------------------------------------------------------
def size_de(item, body):
    """Tamano de fuente segun el tipo de item, en funcion del cuerpo base."""
    t = item["tipo"]
    if t == "titulo":
        return body + 1.4, True   # negrita
    if t == "subtitulo":
        return body - 0.2, False
    if t == "encabezado":
        return body, True
    return body, False

def envuelve(runs, size, max_w):
    """Divide una lista de runs en varias lineas que quepan en max_w.
    El corte se hace en limites de palabra (espacios de runs base)."""
    # Primero re-expandimos a 'palabras' conservando subindices.
    palabras = []           # cada palabra = lista de runs
    actual = []
    for txt, es_sub in runs:
        if es_sub:
            actual.append((txt, True))
            continue
        # dividir el run base por espacios, conservando los espacios como
        # separadores de palabra
        trozos = re.split(r"(\s+)", txt)
        for tr in trozos:
            if tr == "":
                continue
            if tr.strip() == "":
                # espacio: cierra palabra
                if actual:
                    palabras.append(actual)
                    actual = []
            else:
                actual.append((tr, False))
    if actual:
        palabras.append(actual)

    # ahora empaqueta palabras en lineas
    lineas = []
    cur = []
    cur_w = 0.0
    space_w = stringWidth(" ", FONT, size)
    for pal in palabras:
        pw = ancho_runs(pal, size)
        extra = space_w if cur else 0.0
        if cur and cur_w + extra + pw > max_w:
            lineas.append(cur)
            cur = list(pal)
            cur_w = pw
        else:
            if cur:
                cur.append((" ", False))
                cur_w += space_w
            cur.extend(pal)
            cur_w += pw
    if cur:
        lineas.append(cur)
    if not lineas:
        lineas = [[("", False)]]
    return lineas

def maqueta(items, body):
    """Devuelve (cabe, alto_total, render) para un tamano de cuerpo base.
    render = lista de dicts: {tipo, kind('text'|'rule'), runs?, size?}"""
    render = []
    alto = 0.0
    max_overflow = 0.0
    for item in items:
        if item["tipo"] == "regla":
            # espacio antes + linea + espacio despues
            alto += body * 0.55
            render.append({"kind": "rule", "y_gap_before": 0.0})
            alto += body * 0.30
            continue
        size, bold = size_de(item, body)
        runs = tokeniza(item["texto"])
        # Importante: la negrita mide casi igual con DejaVu; medimos con FONT.
        lineas = envuelve(runs, size, USABLE_W)
        # registra overflow de la palabra mas ancha individual
        for ln in lineas:
            w = ancho_runs(ln, size)
            if w > USABLE_W:
                max_overflow = max(max_overflow, w - USABLE_W)
        for ln in lineas:
            render.append({"kind": "text", "tipo": item["tipo"],
                           "runs": ln, "size": size, "bold": bold})
            alto += size * LEADING
        # pequeno respiro tras titulo/encabezado
        if item["tipo"] in ("titulo",):
            alto += body * 0.10
    cabe = (alto <= (TOP - MARGEN)) and (max_overflow <= 0.01)
    return cabe, alto, render

# ----------------------------------------------------------------------------
# Dibujo de una pagina
# ----------------------------------------------------------------------------
def dibuja_pagina(c, items):
    # Busca el cuerpo mas grande que quepa (alto y ancho).
    body = 4.4
    render = None
    while body >= 2.6:
        cabe, alto, r = maqueta(items, body)
        if cabe:
            render = r
            break
        body -= 0.05
    if render is None:
        # ultimo recurso: usa el minimo y aun asi dibuja (no deberia ocurrir)
        _, _, render = maqueta(items, 2.6)
        body = 2.6

    c.setFillColorRGB(0, 0, 0)
    c.setStrokeColorRGB(0, 0, 0)

    y = TOP
    for el in render:
        if el["kind"] == "rule":
            y -= body * 0.55
            c.setLineWidth(RULE_W)
            c.setLineCap(0)
            c.line(X0, y, X1, y)
            y -= body * 0.30
            continue
        size = el["size"]
        y -= size  # bajamos al baseline de esta linea
        font = FONT_B if el["bold"] else FONT
        # dibujamos runs con la fuente correcta (bold/regular)
        cx = X0
        for txt, es_sub in el["runs"]:
            if es_sub:
                fs = size * SUB_FRAC
                c.setFont(font, fs)
                c.drawString(cx, y - size * SUB_DROP, txt)
                cx += stringWidth(txt, font, fs)
            else:
                c.setFont(font, size)
                c.drawString(cx, y, txt)
                cx += stringWidth(txt, font, size)
        y -= size * (LEADING - 1.0)
        if el["tipo"] == "titulo":
            y -= body * 0.10
    return body

# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    circuitos = data["circuitos"]

    c = canvas.Canvas(PDF_PATH, pagesize=PAGESIZE)
    c.setTitle("Etiquetas BJT - amplificadores")
    for cir in circuitos:
        items = construye_items(cir)
        body = dibuja_pagina(c, items)
        sys.stderr.write(f"  [{cir['id']}] {cir['nombre']}: cuerpo={body:.2f} pt\n")
        c.showPage()
    c.save()
    print(f"OK -> {PDF_PATH}  ({len(circuitos)} paginas, "
          f"{PAGE_W:.3f} x {PAGE_H:.3f} pt)")

if __name__ == "__main__":
    main()
