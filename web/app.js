/* =========================================================================
   app.js — Lógica del Simulador de Amplificadores BJT (vanilla JS)
   Depende de: window.CIRCUITOS (circuitos.data.js) y window.BJT (engine.js).
   100 % cliente, sin frameworks ni recursos externos.
   ========================================================================= */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     ESTADO GLOBAL
     ---------------------------------------------------------------------- */
  var CIRCUITOS = window.CIRCUITOS.circuitos;
  var preset = null;        // circuito seleccionado (objeto del JSON)
  var valores = {};         // valores actuales de TODOS los componentes
  var amplitudMv = 10;      // amplitud de la señal de entrada en mV
  var rafPendiente = false; // control de requestAnimationFrame para fluidez

  /* ----------------------------------------------------------------------
     UTILIDADES DE FORMATO (unidades de ingeniería)
     ---------------------------------------------------------------------- */

  // Formatea una resistencia en Ω / kΩ / MΩ.
  function fmtOhm(v) {
    if (v >= 1e6) return redondea(v / 1e6) + " MΩ";
    if (v >= 1e3) return redondea(v / 1e3) + " kΩ";
    return redondea(v) + " Ω";
  }

  // Formatea una corriente en µA / mA / A.
  function fmtCorriente(v) {
    var a = Math.abs(v);
    if (a < 1e-3) return redondea(v * 1e6) + " µA";
    if (a < 1) return redondea(v * 1e3) + " mA";
    return redondea(v) + " A";
  }

  // Formatea una tensión en mV / V.
  function fmtTension(v) {
    if (Math.abs(v) < 1) return redondea(v * 1e3) + " mV";
    return redondea(v) + " V";
  }

  // Redondea a 3 cifras significativas para una lectura limpia.
  function redondea(v) {
    if (v === 0) return "0";
    if (!isFinite(v)) return "∞";
    var n = Number(v.toPrecision(3));
    return String(n);
  }

  // Formato compacto de un número para la sustitución de ecuaciones (kΩ/µ...).
  function fmtCompacto(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return redondea(v / 1e6) + "M";
    if (a >= 1e3) return redondea(v / 1e3) + "k";
    if (a >= 1) return redondea(v);
    if (a >= 1e-3) return redondea(v * 1e3) + "m";
    if (a >= 1e-6) return redondea(v * 1e6) + "µ";
    return redondea(v);
  }

  /* ----------------------------------------------------------------------
     METADATOS DE COMPONENTES AJUSTABLES (rangos de slider)
     ---------------------------------------------------------------------- */

  // Devuelve {min,max,log,unidad,paso} para cada componente ajustable.
  function rangoComponente(nombre, porDefecto) {
    if (nombre === "beta") {
      return { min: 20, max: 400, log: false, unidad: "", paso: 1 };
    }
    if (nombre === "VCC") {
      // Rango realista de alimentación.
      return { min: 3, max: 30, log: false, unidad: "V", paso: 0.5 };
    }
    // Resistencias: escala logarítmica, ~0.1× .. 10× del valor por defecto.
    return { min: porDefecto * 0.1, max: porDefecto * 10, log: true, unidad: "Ω", paso: 1 };
  }

  /* ----------------------------------------------------------------------
     CÁLCULO: construye la config para BJT.solve a partir de los valores
     ---------------------------------------------------------------------- */
  function configActual() {
    var c = { topologia: preset.topologia, VCC: valores.VCC, beta: valores.beta };
    // Añade únicamente las resistencias propias de la topología.
    preset.ajustables.forEach(function (k) {
      if (k !== "VCC" && k !== "beta") c[k] = valores[k];
    });
    return c;
  }

  /* ----------------------------------------------------------------------
     INICIALIZACIÓN
     ---------------------------------------------------------------------- */
  function init() {
    aplicarTemaInicial();
    construirSelector();
    // Permite enlazar directamente a un circuito con ?circuito=c1|c2|c3.
    var idInicial = CIRCUITOS[0].id;
    try {
      var q = new URLSearchParams(window.location.search).get("circuito");
      if (q && CIRCUITOS.some(function (c) { return c.id === q; })) idInicial = q;
    } catch (e) { /* sin URL */ }
    seleccionarCircuito(idInicial);

    document.getElementById("btn-tema").addEventListener("click", alternarTema);
    document.getElementById("btn-restablecer").addEventListener("click", restablecer);

    var sliderAmp = document.getElementById("slider-amplitud");
    sliderAmp.addEventListener("input", function () {
      amplitudMv = Number(sliderAmp.value);
      document.getElementById("salida-amplitud").textContent = amplitudMv + " mV";
      pedirRedibujoSenal();
    });

    // Redibuja la señal al cambiar el tamaño de la ventana (canvas responsive).
    // Envuelto para NO pasar el objeto Event como 'res' (sobrescribiría ultimoRes).
    window.addEventListener("resize", function () { pedirRedibujoSenal(); });
  }

  /* ----------------------------------------------------------------------
     TEMA CLARO/OSCURO
     ---------------------------------------------------------------------- */
  function aplicarTemaInicial() {
    // Prioridad: parámetro de URL (?tema=claro|oscuro) > localStorage > preferencia del SO.
    var forzado = null;
    try {
      var params = new URLSearchParams(window.location.search);
      var q = params.get("tema");
      if (q === "oscuro" || q === "claro") forzado = q;
    } catch (e) { /* entornos sin URL: se ignora */ }

    var guardado = localStorage.getItem("bjt-tema");
    var tema = forzado || guardado ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");
    document.documentElement.setAttribute("data-tema", tema);
  }

  function alternarTema() {
    var actual = document.documentElement.getAttribute("data-tema");
    var nuevo = actual === "oscuro" ? "claro" : "oscuro";
    document.documentElement.setAttribute("data-tema", nuevo);
    localStorage.setItem("bjt-tema", nuevo);
    // El SVG y el canvas usan colores del tema: hay que redibujar.
    render();
  }

  /* ----------------------------------------------------------------------
     SELECTOR DE CIRCUITO (pestañas)
     ---------------------------------------------------------------------- */
  function construirSelector() {
    var cont = document.getElementById("selector-circuito");
    cont.innerHTML = "";
    CIRCUITOS.forEach(function (circ) {
      var btn = document.createElement("button");
      btn.className = "pestania";
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.dataset.id = circ.id;
      btn.innerHTML =
        '<span class="nombre">' + circ.nombre + "</span>" +
        '<span class="topo">' + circ.subtitulo + "</span>";
      btn.addEventListener("click", function () { seleccionarCircuito(circ.id); });
      cont.appendChild(btn);
    });
  }

  function seleccionarCircuito(id) {
    preset = CIRCUITOS.find(function (c) { return c.id === id; });
    // Copia profunda de los componentes por defecto a los valores actuales.
    valores = Object.assign({}, preset.componentes);

    // Marca la pestaña activa.
    document.querySelectorAll(".pestania").forEach(function (b) {
      b.setAttribute("aria-selected", b.dataset.id === id ? "true" : "false");
    });

    document.getElementById("titulo-circuito").textContent = preset.nombre;
    document.getElementById("subtitulo-circuito").textContent = preset.subtitulo;

    construirControles();
    render();
  }

  function restablecer() {
    // Vuelve a los valores por defecto del preset y refresca controles + UI.
    valores = Object.assign({}, preset.componentes);
    construirControles();
    document.getElementById("slider-amplitud").value = amplitudMv; // amplitud se mantiene
    render();
  }

  /* ----------------------------------------------------------------------
     CONTROLES (slider + campo numérico por componente ajustable)
     ---------------------------------------------------------------------- */
  function construirControles() {
    var cont = document.getElementById("controles");
    cont.innerHTML = "";

    preset.ajustables.forEach(function (nombre) {
      var def = preset.componentes[nombre];
      var r = rangoComponente(nombre, def);

      var grupo = document.createElement("div");
      grupo.className = "control-grupo";

      var idSlider = "sl-" + nombre;
      var idCampo = "in-" + nombre;
      var etiqueta = etiquetaComponente(nombre);

      grupo.innerHTML =
        '<label for="' + idSlider + '">' + etiqueta + "</label>" +
        '<div class="fila-control">' +
          '<input type="range" id="' + idSlider + '" aria-label="' + etiqueta + ' (deslizador)">' +
          '<input type="number" id="' + idCampo + '" class="campo-numerico" aria-label="' + etiqueta + ' (valor)">' +
          '<span class="unidad-campo">' + r.unidad + "</span>" +
        "</div>";
      cont.appendChild(grupo);

      var slider = grupo.querySelector("#" + idSlider);
      var campo = grupo.querySelector("#" + idCampo);

      // Configura el slider: escala log usa posición 0..1000 -> valor exponencial.
      if (r.log) {
        slider.min = 0; slider.max = 1000; slider.step = 1;
        slider.value = valorAPosLog(valores[nombre], r);
        campo.min = r.min; campo.max = r.max; campo.step = "any";
      } else {
        slider.min = r.min; slider.max = r.max; slider.step = r.paso;
        slider.value = valores[nombre];
        campo.min = r.min; campo.max = r.max; campo.step = r.paso;
      }
      campo.value = valorCampo(nombre, valores[nombre]);

      // Slider -> actualiza valor y campo.
      slider.addEventListener("input", function () {
        var v = r.log ? posLogAValor(Number(slider.value), r) : Number(slider.value);
        valores[nombre] = v;
        campo.value = valorCampo(nombre, v);
        render();
      });

      // Campo numérico -> actualiza valor y slider.
      campo.addEventListener("input", function () {
        var v = Number(campo.value);
        if (!isFinite(v) || v <= 0) return;            // ignora entradas inválidas
        v = Math.min(r.max, Math.max(r.min, v));
        valores[nombre] = v;
        slider.value = r.log ? valorAPosLog(v, r) : v;
        render();
      });
    });
  }

  // Valor mostrado en el campo numérico (resistencias enteras, β entero, VCC con decimal).
  function valorCampo(nombre, v) {
    if (nombre === "beta") return Math.round(v);
    if (nombre === "VCC") return Number(v.toFixed(1));
    return Math.round(v);
  }

  // Conversión escala logarítmica <-> posición de slider (0..1000).
  function valorAPosLog(v, r) {
    var t = (Math.log(v) - Math.log(r.min)) / (Math.log(r.max) - Math.log(r.min));
    return Math.round(Math.max(0, Math.min(1, t)) * 1000);
  }
  function posLogAValor(pos, r) {
    var t = pos / 1000;
    return Math.exp(Math.log(r.min) + t * (Math.log(r.max) - Math.log(r.min)));
  }

  // Etiqueta legible con subíndice para cada componente.
  function etiquetaComponente(nombre) {
    if (nombre === "beta") return "β (ganancia de corriente)";
    if (nombre === "VCC") return "V<sub>CC</sub> (alimentación)";
    // R1, R2, RC, RE, RB, RF -> el dígito/letra final como subíndice.
    return nombre.replace(/^R(.+)$/, "R<sub>$1</sub>");
  }

  /* ----------------------------------------------------------------------
     RENDER PRINCIPAL: recalcula con BJT.solve y actualiza toda la UI
     ---------------------------------------------------------------------- */
  function render() {
    var c = configActual();
    var res;
    try {
      res = window.BJT.solve(c);
    } catch (e) {
      return; // configuración inválida momentánea: no rompe la UI
    }
    dibujarEsquema(c);
    pintarDC(res);
    pintarAC(res);
    pintarEcuaciones(c, res);
    pedirRedibujoSenal(res, c);
  }

  /* ----------------------------------------------------------------------
     PANEL DC: punto de operación
     ---------------------------------------------------------------------- */
  function pintarDC(res) {
    var dc = res.dc;
    var items = [];
    if (dc.VB !== undefined) items.push(["V_B", fmtTension(dc.VB)]);
    if (dc.VE !== undefined) items.push(["V_E", fmtTension(dc.VE)]);
    items.push(["I_B", fmtCorriente(dc.IB)]);
    items.push(["I_C", fmtCorriente(dc.IC)]);
    items.push(["I_E", fmtCorriente(dc.IE)]);
    items.push(["r_e", fmtOhm(dc.re)]);
    items.push(["V_CE", fmtTension(dc.VCE)]);

    var dl = document.getElementById("dc-valores");
    dl.innerHTML = items.map(function (p) {
      return '<div class="magnitud"><dt>' + subindices(p[0]) + "</dt><dd>" + p[1] + "</dd></div>";
    }).join("");

    // Aviso de región de operación (saturación / corte / activa).
    var avEstado = document.getElementById("aviso-estado");
    if (dc.VCE < 0.3) {
      mostrarAviso(avEstado, "⚠ Transistor en SATURACIÓN (V_CE < 0.3 V): el amplificador no funciona linealmente.", true);
    } else if (dc.IC <= 0 || dc.VCE >= valores.VCC - 0.05) {
      mostrarAviso(avEstado, "⚠ Transistor cerca del CORTE: corriente de colector casi nula.", true);
    } else {
      avEstado.hidden = true;
    }

    // Aviso del método del divisor de voltaje.
    var avMetodo = document.getElementById("aviso-metodo");
    if (res.check) {
      var ok = res.check.aproxValido;
      avMetodo.hidden = false;
      avMetodo.textContent = ok
        ? "Método aproximado del divisor VÁLIDO: β·RE = " + fmtOhm(res.check.betaRE) +
          " ≥ 10·R2 = " + fmtOhm(res.check.diezR2) + " (" + (dc.metodo || "aproximado") + ")."
        : "Método aproximado NO válido (β·RE = " + fmtOhm(res.check.betaRE) +
          " < 10·R2 = " + fmtOhm(res.check.diezR2) + "): se usa solución " + (dc.metodo || "exacta") + ".";
    } else {
      avMetodo.hidden = true;
    }
  }

  function mostrarAviso(el, texto, peligro) {
    el.hidden = false;
    el.textContent = texto;
    el.className = "aviso" + (peligro ? " aviso-peligro" : " aviso-info");
  }

  /* ----------------------------------------------------------------------
     PANEL AC: ganancia e impedancias
     ---------------------------------------------------------------------- */
  function pintarAC(res) {
    var ac = res.ac;
    var dB = 20 * Math.log10(Math.abs(ac.Av));
    var items = [];
    items.push(["A_v", redondea(ac.Av) + '  <span style="font-size:.8rem;color:var(--texto-tenue)">(' +
      (isFinite(dB) ? redondea(dB) + " dB" : "—") + ")</span>"]);
    items.push(["Z_i", fmtOhm(ac.Zi)]);
    items.push(["Z_o", fmtOhm(ac.Zo)]);
    // Realimentación de colector: muestra también el Av aproximado de cálculo a mano.
    if (ac.AvSimple !== undefined) {
      items.push(["A_v (aprox.)", redondea(ac.AvSimple)]);
    }

    var dl = document.getElementById("ac-valores");
    dl.innerHTML = items.map(function (p) {
      return '<div class="magnitud"><dt>' + subindices(p[0]) + "</dt><dd>" + p[1] + "</dd></div>";
    }).join("");

    var nota = document.getElementById("nota-ac");
    if (ac.AvSimple !== undefined) {
      nota.hidden = false;
      nota.innerHTML = subindices(
        "La realimentación por R_F corrige la ganancia: el valor exacto (modelo nodal) difiere algo del cálculo aproximado −R_C/(r_e+R_E).");
    } else {
      nota.hidden = true;
    }
  }

  /* ----------------------------------------------------------------------
     ECUACIONES: plantilla simbólica del JSON + sustitución EN VIVO
     ---------------------------------------------------------------------- */

  // Convierte "X_Y" en X con subíndice <sub>Y</sub>.
  function subindices(texto) {
    return texto.replace(/([A-Za-zβ∞])_([A-Za-z0-9]+)/g, "$1<sub>$2</sub>");
  }

  function pintarEcuaciones(c, res) {
    renderListaEcuaciones("ecuaciones-dc", preset.ecuaciones_dc, c, res);
    renderListaEcuaciones("ecuaciones-ac", preset.ecuaciones_ac, c, res);
  }

  // Separa un operador relacional (≈, ≤, ≥, <, >) al inicio de rhs para no
  // duplicar el '=' (p. ej. "I_C = ≈ I_E" → "I_C ≈ I_E").
  function operadorRel(rhs) {
    var r = String(rhs).trim(), syms = ["≈", "≤", "≥", "<", ">"];
    for (var i = 0; i < syms.length; i++) {
      if (r.indexOf(syms[i]) === 0) return { rel: syms[i], rhs: r.slice(syms[i].length).trim() };
    }
    return { rel: "=", rhs: r };
  }

  function renderListaEcuaciones(idCont, lista, c, res) {
    var cont = document.getElementById(idCont);
    cont.innerHTML = lista.map(function (eq) {
      var s = sustitucionViva(eq.lhs, c, res); // {subst, val} recalculados en vivo
      var op = operadorRel(eq.rhs);
      return '<div class="ecuacion">' +
        '<span class="simbolica"><span class="lhs">' + subindices(eq.lhs) + "</span> " + op.rel + " " +
          subindices(op.rhs) + "</span>" +
        '<span class="sustitucion">' + s.subst +
          ' = <span class="resultado">' + s.val + "</span></span>" +
        "</div>";
    }).join("");
  }

  // Recalcula la sustitución numérica y el resultado EN VIVO según lhs.
  function sustitucionViva(lhs, c, res) {
    var dc = res.dc, ac = res.ac;
    var topo = preset.topologia;
    var VBE = window.BJT.VBE, VT = window.BJT.VT;
    var f = fmtCompacto;

    switch (lhs) {
      case "V_B":
        return { subst: "(" + f(c.VCC) + "·" + f(c.R2) + ") / (" + f(c.R1) + " + " + f(c.R2) + ")",
                 val: fmtTension(dc.VB) };
      case "V_E":
        if (topo === "voltage_divider")
          return { subst: f(dc.VB) + " − " + VBE, val: fmtTension(dc.VE) };
        break;
      case "I_B":
        if (topo === "collector_feedback")
          return { subst: "(" + f(c.VCC) + " − " + VBE + ") / (" + f(c.RF) + " + " + f(c.beta) +
                   "·(" + f(c.RC) + " + " + f(c.RE) + "))", val: fmtCorriente(dc.IB) };
        if (topo === "emitter_bias")
          return { subst: "(" + f(c.VCC) + " − " + VBE + ") / (" + f(c.RB) + " + " + f(c.beta + 1) +
                   "·" + f(c.RE) + ")", val: fmtCorriente(dc.IB) };
        break;
      case "I_C":
        if (topo === "voltage_divider")
          return { subst: "≈ I_E", val: fmtCorriente(dc.IC) };
        return { subst: f(c.beta) + " · " + fmtCorriente(dc.IB), val: fmtCorriente(dc.IC) };
      case "I_E":
        if (topo === "voltage_divider")
          return { subst: fmtTension(dc.VE) + " / " + f(c.RE), val: fmtCorriente(dc.IE) };
        return { subst: f(c.beta + 1) + " · " + fmtCorriente(dc.IB), val: fmtCorriente(dc.IE) };
      case "r_e":
        return { subst: "26m / " + fmtCorriente(dc.IE), val: fmtOhm(dc.re) };
      case "V_CE":
        if (topo === "voltage_divider")
          return { subst: f(c.VCC) + " − " + fmtCorriente(dc.IC) + "·" + f(c.RC + c.RE),
                   val: fmtTension(dc.VCE) };
        return { subst: f(c.VCC) + " − " + fmtTension(dc.IC * c.RC) + " − " + fmtTension(dc.IE * c.RE),
                 val: fmtTension(dc.VCE) };
      case "A_v":
        if (topo === "collector_feedback")
          return { subst: "−" + f(c.RC) + " / (" + f(dc.re) + " + " + f(c.RE) + ")",
                   val: redondea(ac.Av) };
        return { subst: "−" + f(c.RC) + " / " + f(dc.re), val: redondea(ac.Av) };
      case "Z_i":
        if (topo === "voltage_divider")
          return { subst: f(c.R1) + " ∥ " + f(c.R2) + " ∥ " + f(ac.betaRe), val: fmtOhm(ac.Zi) };
        if (topo === "emitter_bias")
          return { subst: f(c.RB) + " ∥ " + f(ac.betaRe), val: fmtOhm(ac.Zi) };
        if (topo === "collector_feedback")
          return { subst: f(ac.Zb) + " ∥ " + f(c.RF) + "/(1−A_v)", val: fmtOhm(ac.Zi) };
        break;
      case "Z_o":
        if (topo === "collector_feedback")
          return { subst: f(c.RC) + " ∥ " + f(c.RF), val: fmtOhm(ac.Zo) };
        return { subst: f(c.RC), val: fmtOhm(ac.Zo) };
    }
    // Fallback genérico (no debería alcanzarse).
    return { subst: "—", val: "—" };
  }

  /* ----------------------------------------------------------------------
     ESQUEMA SVG (dibujado por nosotros, usa currentColor)
     ---------------------------------------------------------------------- */
  function dibujarEsquema(c) {
    var cont = document.getElementById("esquema");
    var svg;
    if (preset.topologia === "voltage_divider") svg = svgDivisor(c);
    else if (preset.topologia === "emitter_bias") svg = svgEmisor(c);
    else svg = svgRealimentacion(c);
    cont.innerHTML = svg;
  }

  // --- Primitivas de dibujo (devuelven cadenas SVG) ---

  // Resistencia en zig-zag entre (x1,y1) y (x2,y2) con etiqueta.
  function resistencia(x1, y1, x2, y2, etiq, valor) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / len, uy = dy / len;        // vector unitario eje
    var px = -uy, py = ux;                    // perpendicular
    var zig = 6, amp = 7, segs = zig * 2;
    var inicio = len * 0.25, fin = len * 0.75; // tramos rectos en extremos
    var d = "M" + x1 + "," + y1;
    // Tramo recto inicial
    var sx = x1 + ux * inicio, sy = y1 + uy * inicio;
    d += " L" + sx + "," + sy;
    var paso = (fin - inicio) / segs;
    for (var i = 1; i <= segs; i++) {
      var along = inicio + paso * i;
      var lado = (i % 2 === 0) ? 0 : (i % 4 === 1 ? 1 : -1);
      var bx = x1 + ux * along + px * amp * lado;
      var by = y1 + uy * along + py * amp * lado;
      d += " L" + bx + "," + by;
    }
    // Tramo recto final
    d += " L" + x2 + "," + y2;
    // Etiqueta: horizontal -> debajo y centrada; vertical -> a la derecha, libre del zig-zag.
    var cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    var horizontal = Math.abs(ux) > Math.abs(uy);
    var lx, ly, anclaje;
    if (horizontal) { lx = cx; ly = cy + 22; anclaje = "middle"; }
    else { lx = cx + 18; ly = cy; anclaje = "start"; }
    return '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2"/>' +
      texto(lx, ly - 4, etiq, "esquema-etiqueta", anclaje) +
      texto(lx, ly + 11, valor, "esquema-valor", anclaje);
  }

  function cable(x1, y1, x2, y2) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="currentColor" stroke-width="2"/>';
  }

  function nodo(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="currentColor"/>';
  }

  // Condensador (dos placas) en horizontal o vertical.
  function condensador(x, y, horizontal, etiq) {
    var s;
    if (horizontal) {
      s = '<line x1="' + (x - 2) + '" y1="' + (y - 9) + '" x2="' + (x - 2) + '" y2="' + (y + 9) +
          '" stroke="currentColor" stroke-width="2"/>' +
          '<line x1="' + (x + 2) + '" y1="' + (y - 9) + '" x2="' + (x + 2) + '" y2="' + (y + 9) +
          '" stroke="currentColor" stroke-width="2"/>';
    } else {
      s = '<line x1="' + (x - 9) + '" y1="' + (y - 2) + '" x2="' + (x + 9) + '" y2="' + (y - 2) +
          '" stroke="currentColor" stroke-width="2"/>' +
          '<line x1="' + (x - 9) + '" y1="' + (y + 2) + '" x2="' + (x + 9) + '" y2="' + (y + 2) +
          '" stroke="currentColor" stroke-width="2"/>';
    }
    if (etiq) s += texto(x + 12, y + 4, etiq, "esquema-valor", "start");
    return s;
  }

  // Transistor NPN: círculo, base, colector y emisor con flecha (emisor saliente).
  function transistorNPN(x, y) {
    var r = 26;
    var bx = x - r;                 // entrada de base (izquierda del círculo)
    var s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="currentColor" stroke-width="2"/>';
    // Barra vertical de base
    s += '<line x1="' + (x - 9) + '" y1="' + (y - 13) + '" x2="' + (x - 9) + '" y2="' + (y + 13) +
         '" stroke="currentColor" stroke-width="2.5"/>';
    // Terminal de base hacia la izquierda
    s += cable(bx, y, x - 9, y);
    // Colector (arriba) y emisor (abajo) hacia la barra
    s += '<line x1="' + (x - 9) + '" y1="' + (y - 8) + '" x2="' + (x + 14) + '" y2="' + (y - 20) +
         '" stroke="currentColor" stroke-width="2"/>';
    s += '<line x1="' + (x - 9) + '" y1="' + (y + 8) + '" x2="' + (x + 14) + '" y2="' + (y + 20) +
         '" stroke="currentColor" stroke-width="2"/>';
    // Terminales externos
    s += cable(x + 14, y - 20, x + 14, y - r - 6); // colector arriba
    s += cable(x + 14, y + 20, x + 14, y + r + 6); // emisor abajo
    // Flecha del emisor (NPN: apunta hacia fuera)
    s += '<path d="M' + (x + 7) + ',' + (y + 12) + ' L' + (x + 14) + ',' + (y + 20) +
         ' L' + (x + 4) + ',' + (y + 19) + ' Z" fill="currentColor"/>';
    return s;
  }

  // Símbolo de VCC (alimentación) en la parte superior.
  function fuenteVCC(x, y, valor) {
    return cable(x, y, x, y + 12) +
      '<text x="' + x + '" y="' + (y - 6) + '" text-anchor="middle" class="esquema-etiqueta">+V<tspan baseline-shift="sub" font-size="9">CC</tspan></text>' +
      texto(x, y - 22, fmtTension(valor), "esquema-valor", "middle");
  }

  // Tierra (GND).
  function tierra(x, y) {
    return cable(x, y, x, y + 10) +
      '<line x1="' + (x - 12) + '" y1="' + (y + 10) + '" x2="' + (x + 12) + '" y2="' + (y + 10) + '" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="' + (x - 7) + '" y1="' + (y + 15) + '" x2="' + (x + 7) + '" y2="' + (y + 15) + '" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="' + (x - 3) + '" y1="' + (y + 20) + '" x2="' + (x + 3) + '" y2="' + (y + 20) + '" stroke="currentColor" stroke-width="2"/>';
  }

  function texto(x, y, t, clase, anclaje) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anclaje || "middle") +
      '" class="' + clase + '">' + t + "</text>";
  }

  // Etiqueta de resistencia con subíndice (devuelve string para usar como 'etiq').
  function etqR(nombre) { return nombre.replace(/^R(.+)$/, "R<tspan baseline-shift='sub' font-size='9'>$1</tspan>"); }

  function abrirSVG(w, h) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img">';
  }

  // ---- Divisor de voltaje: R1, R2, RC, RE (con condensador si re_bypass) ----
  function svgDivisor(c) {
    var s = abrirSVG(360, 360);
    var xBase = 90, xCol = 230, yTopo = 30, yBot = 320;
    // Riel superior VCC
    s += fuenteVCC(xCol, yTopo, c.VCC);
    s += cable(xBase, 42, xCol, 42);   // riel
    s += cable(xCol, 42, xCol, 60);
    // R1 (de VCC a base)
    s += resistencia(xBase, 42, xBase, 130, etqR("R1"), fmtOhm(c.R1));
    // Nodo base
    var yB = 165;
    s += cable(xBase, 130, xBase, yB);
    s += nodo(xBase, yB);
    // R2 (de base a tierra)
    s += resistencia(xBase, yB, xBase, 280, etqR("R2"), fmtOhm(c.R2));
    s += cable(xBase, 280, xBase, 320);
    s += tierra(xBase, 320);
    // RC (de VCC a colector)
    s += resistencia(xCol, 60, xCol, 140, etqR("RC"), fmtOhm(c.RC));
    // Transistor
    s += cable(xCol, 140, xCol, 152);
    s += transistorNPN(xCol, 185);
    s += cable(xCol, 140, xCol - 14, 140);   // colector al cuerpo (alineación visual)
    // Entrada (condensador de acoplo a la base)
    s += cable(30, yB, 60, yB);
    s += condensador(60, yB, true, "");
    s += cable(64, yB, xBase, yB);
    s += texto(30, yB - 12, "v_i", "esquema-valor", "middle").replace("v_i", "v<tspan baseline-shift='sub' font-size='9'>i</tspan>");
    // Salida (condensador desde colector)
    s += cable(xCol + 14, 152, xCol + 14, 140);
    s += cable(xCol, 152, xCol, 152);
    s += cable(xCol + 14, 152, 300, 152);
    s += condensador(300, 152, true, "");
    s += cable(304, 152, 330, 152);
    s += texto(335, 156, "v_o", "esquema-valor", "start").replace("v_o", "v<tspan baseline-shift='sub' font-size='9'>o</tspan>");
    // Emisor -> RE
    s += cable(xCol + 14, 217, xCol + 14, 240);
    s += cable(xCol + 14, 240, xCol, 240);
    s += resistencia(xCol, 240, xCol, 300, etqR("RE"), fmtOhm(c.RE));
    s += cable(xCol, 300, xCol, 320);
    s += tierra(xCol, 320);
    // Condensador de desacoplo de emisor (CE) en paralelo con RE
    if (preset.re_bypass) {
      var xCE = xCol + 72;
      s += cable(xCol, 240, xCE, 240);
      s += cable(xCE, 240, xCE, 262);
      s += condensador(xCE, 270, false, "");
      s += cable(xCE, 278, xCE, 300);
      s += cable(xCE, 300, xCol, 300);
      s += texto(xCE + 12, 274, "C_E", "esquema-valor", "start").replace("C_E", "C<tspan baseline-shift='sub' font-size='9'>E</tspan>");
    }
    s += "</svg>";
    return s;
  }

  // ---- Polarización de emisor: RB, RC, RE ----
  function svgEmisor(c) {
    var s = abrirSVG(360, 360);
    var xBase = 90, xCol = 230, yTopo = 30;
    s += fuenteVCC(xCol, yTopo, c.VCC);
    s += cable(xBase, 42, xCol, 42);
    s += cable(xCol, 42, xCol, 60);
    // RB de VCC a la base
    s += resistencia(xBase, 42, xBase, 150, etqR("RB"), fmtOhm(c.RB));
    var yB = 185;
    s += cable(xBase, 150, xBase, yB);
    s += nodo(xBase, yB);
    // RC de VCC al colector
    s += resistencia(xCol, 60, xCol, 140, etqR("RC"), fmtOhm(c.RC));
    s += cable(xCol, 140, xCol, 152);
    s += transistorNPN(xCol, 185);
    // Base del transistor conectada al nodo
    s += cable(xBase, yB, xCol - 26, yB);
    // Entrada
    s += cable(30, yB, 60, yB);
    s += condensador(60, yB, true, "");
    s += cable(64, yB, xBase, yB);
    s += texto(30, yB - 12, "v_i", "esquema-valor", "middle").replace("v_i", "v<tspan baseline-shift='sub' font-size='9'>i</tspan>");
    // Salida
    s += cable(xCol + 14, 152, 300, 152);
    s += condensador(300, 152, true, "");
    s += cable(304, 152, 330, 152);
    s += texto(335, 156, "v_o", "esquema-valor", "start").replace("v_o", "v<tspan baseline-shift='sub' font-size='9'>o</tspan>");
    // Emisor -> RE
    s += cable(xCol + 14, 217, xCol + 14, 240);
    s += cable(xCol + 14, 240, xCol, 240);
    s += resistencia(xCol, 240, xCol, 300, etqR("RE"), fmtOhm(c.RE));
    s += cable(xCol, 300, xCol, 320);
    s += tierra(xCol, 320);
    if (preset.re_bypass) {
      var xCE = xCol + 72;
      s += cable(xCol, 240, xCE, 240);
      s += cable(xCE, 240, xCE, 262);
      s += condensador(xCE, 270, false, "");
      s += cable(xCE, 278, xCE, 300);
      s += cable(xCE, 300, xCol, 300);
      s += texto(xCE + 12, 274, "C_E", "esquema-valor", "start").replace("C_E", "C<tspan baseline-shift='sub' font-size='9'>E</tspan>");
    }
    s += "</svg>";
    return s;
  }

  // ---- Realimentación de colector: RF (de colector a base), RC, RE (sin bypass) ----
  function svgRealimentacion(c) {
    var s = abrirSVG(360, 360);
    var xBase = 90, xCol = 230, yTopo = 30;
    s += fuenteVCC(xCol, yTopo, c.VCC);
    s += cable(xCol, 42, xCol, 60);
    // RC de VCC a colector
    s += resistencia(xCol, 60, xCol, 140, etqR("RC"), fmtOhm(c.RC));
    var yCol = 140;
    s += cable(xCol, yCol, xCol, 152);
    s += nodo(xCol, yCol);
    s += transistorNPN(xCol, 185);
    var yB = 185;
    // Nodo base
    s += nodo(xBase, yB);
    s += cable(xBase, yB, xCol - 26, yB);
    // RF: del colector (arriba) a la base — realimentación
    s += cable(xCol, yCol, xCol, 95);
    s += cable(xBase, 95, xBase, yB);
    s += resistencia(xBase, 95, xCol, 95, etqR("RF"), fmtOhm(c.RF));
    // Entrada
    s += cable(30, yB, 55, yB);
    s += condensador(55, yB, true, "");
    s += cable(59, yB, xBase, yB);
    s += texto(30, yB - 12, "v_i", "esquema-valor", "middle").replace("v_i", "v<tspan baseline-shift='sub' font-size='9'>i</tspan>");
    // Salida desde colector
    s += cable(xCol + 14, 152, 300, 152);
    s += condensador(300, 152, true, "");
    s += cable(304, 152, 330, 152);
    s += texto(335, 156, "v_o", "esquema-valor", "start").replace("v_o", "v<tspan baseline-shift='sub' font-size='9'>o</tspan>");
    // Emisor -> RE (sin condensador de desacoplo: re_bypass=false)
    s += cable(xCol + 14, 217, xCol + 14, 240);
    s += cable(xCol + 14, 240, xCol, 240);
    s += resistencia(xCol, 240, xCol, 300, etqR("RE"), fmtOhm(c.RE));
    s += cable(xCol, 300, xCol, 320);
    s += tierra(xCol, 320);
    s += "</svg>";
    return s;
  }

  /* ----------------------------------------------------------------------
     SIMULACIÓN DE SEÑAL (canvas): senoide de entrada y salida
     ---------------------------------------------------------------------- */
  var ultimoRes = null, ultimaConfig = null;

  function pedirRedibujoSenal(res, c) {
    if (res) { ultimoRes = res; ultimaConfig = c; }
    if (rafPendiente) return;
    rafPendiente = true;
    requestAnimationFrame(function () {
      rafPendiente = false;
      dibujarSenal();
    });
  }

  function dibujarSenal() {
    if (!ultimoRes) return;
    var canvas = document.getElementById("canvas-senal");
    var ctx = canvas.getContext("2d");

    // Ajusta la resolución del canvas a su tamaño en pantalla (nitidez).
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var W = Math.max(320, Math.round(rect.width));
    var H = 300;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Lee colores del tema actual.
    var css = getComputedStyle(document.documentElement);
    var colEje = css.getPropertyValue("--canvas-eje").trim();
    var colRejilla = css.getPropertyValue("--canvas-rejilla").trim();
    var colVi = css.getPropertyValue("--vi-color").trim();
    var colVo = css.getPropertyValue("--vo-color").trim();
    var colTexto = css.getPropertyValue("--texto-tenue").trim();
    var colPeligro = css.getPropertyValue("--peligro").trim();

    var Av = ultimoRes.ac.Av;
    var absAv = Math.abs(Av);
    var swing = window.BJT.maxSwing(ultimoRes, ultimaConfig); // pico máx. salida (V)

    // Amplitudes
    var viPico = amplitudMv / 1000;              // V (pico de entrada)
    var voPicoIdeal = viPico * absAv;            // V (pico de salida sin recorte)
    var recorta = swing > 0 && voPicoIdeal > swing;

    // Pico realmente dibujado de la salida (recortado al margen de excursión).
    var voMostrar = swing > 0 ? Math.min(voPicoIdeal, swing) : voPicoIdeal;

    // Escala vertical: basada en lo que SE DIBUJA (vi y vo), para que las ondas
    // sean visibles aunque el margen de excursión (swing) sea mucho mayor.
    // Si hay recorte, voMostrar == swing y las líneas de recorte quedan en pantalla.
    var maxAbs = Math.max(viPico, voMostrar) * 1.15 || 1;

    var margenIzq = 44, margenDer = 16, margenSup = 16, margenInf = 28;
    var x0 = margenIzq, x1 = W - margenDer;
    var yMid = (margenSup + (H - margenInf)) / 2;
    var altoUtil = (H - margenInf - margenSup) / 2;

    function Y(v) { return yMid - (v / maxAbs) * altoUtil; }
    function X(t) { return x0 + t * (x1 - x0); }

    // --- Rejilla y eje cero ---
    ctx.strokeStyle = colRejilla;
    ctx.lineWidth = 1;
    for (var gy = 0; gy <= 4; gy++) {
      var yy = margenSup + (H - margenInf - margenSup) * gy / 4;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    }
    // Eje X (cero)
    ctx.strokeStyle = colEje;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x0, yMid); ctx.lineTo(x1, yMid); ctx.stroke();
    // Eje Y
    ctx.beginPath(); ctx.moveTo(x0, margenSup); ctx.lineTo(x0, H - margenInf); ctx.stroke();

    // Etiquetas de eje
    ctx.fillStyle = colTexto;
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(fmtTension(maxAbs), x0 - 5, Y(maxAbs) + 4);
    ctx.fillText("0", x0 - 5, yMid + 4);
    ctx.fillText("-" + fmtTension(maxAbs), x0 - 5, Y(-maxAbs) + 4);
    ctx.textAlign = "center";
    ctx.fillText("tiempo →", (x0 + x1) / 2, H - 8);

    var N = 240;
    var ciclos = 2;

    // --- Senoide de entrada vi ---
    ctx.strokeStyle = colVi;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= N; i++) {
      var t = i / N;
      var ang = t * ciclos * 2 * Math.PI;
      var v = viPico * Math.sin(ang);
      var px = X(t), py = Y(v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // --- Senoide de salida vo = vi · |Av|, invertida 180°, recortada a ±swing ---
    ctx.strokeStyle = colVo;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var j = 0; j <= N; j++) {
      var t2 = j / N;
      var ang2 = t2 * ciclos * 2 * Math.PI;
      // Inversión de fase: signo negativo de Av (usamos -|Av| explícito).
      var vo = -viPico * absAv * Math.sin(ang2);
      // Recorte simétrico a ±swing.
      if (swing > 0) vo = Math.max(-swing, Math.min(swing, vo));
      var px2 = X(t2), py2 = Y(vo);
      if (j === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    // Líneas de recorte (límite ±swing) si satura.
    if (recorta) {
      ctx.strokeStyle = colPeligro;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, Y(swing)); ctx.lineTo(x1, Y(swing)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, Y(-swing)); ctx.lineTo(x1, Y(-swing)); ctx.stroke();
      ctx.setLineDash([]);
    }

    // --- Leyenda ---
    ctx.textAlign = "left";
    ctx.font = "600 12px -apple-system, system-ui, sans-serif";
    var ly = margenSup + 4;
    ctx.fillStyle = colVi;
    ctx.fillText("■ vi (entrada)", x1 - 150, ly + 8);
    ctx.fillStyle = colVo;
    ctx.fillText("■ vo (salida ×" + redondea(absAv) + ", invertida)", x1 - 150, ly + 26);

    // --- Avisos textuales ---
    var avRecorte = document.getElementById("aviso-recorte");
    avRecorte.hidden = !recorta;

    var leyenda = document.getElementById("leyenda-fase");
    leyenda.innerHTML = "La salida está invertida 180° respecto a la entrada (A<sub>v</sub> &lt; 0). " +
      "Ganancia |A<sub>v</sub>| = " + redondea(absAv) + ". " +
      "Excursión máx. simétrica ≈ ±" + fmtTension(swing) + "." +
      (recorta ? " La señal pedida (±" + fmtTension(voPicoIdeal) + ") excede ese límite: hay recorte."
               : "");
  }

  /* ----------------------------------------------------------------------
     ARRANQUE
     ---------------------------------------------------------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
