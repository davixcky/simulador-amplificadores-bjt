#!/usr/bin/env python3
"""Regenera web/circuitos.data.js a partir de datos/circuitos.json."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
d = json.loads((root/"datos/circuitos.json").read_text(encoding="utf-8"))
out = "/* Generado desde datos/circuitos.json — NO editar a mano. */\n"
out += "window.CIRCUITOS = " + json.dumps(d, ensure_ascii=False, indent=2) + ";\n"
(root/"web/circuitos.data.js").write_text(out, encoding="utf-8")
print("OK")
