/*
 * engine.js — Motor de cálculo de amplificadores BJT (modelo r_e, ro = ∞)
 * Funciona en el navegador (window.BJT) y en Node (module.exports).
 *
 * Supuestos: VBE = 0.7 V, VT = 26 mV, ro = ∞.
 * Topologías: voltage_divider, emitter_bias, collector_feedback.
 * Todas las resistencias en ohmios, tensiones en voltios, corrientes en amperios.
 */
(function (root) {
  "use strict";

  var VBE = 0.7;
  var VT = 0.026;

  function par(a, b) { return (a * b) / (a + b); } // paralelo de dos resistencias

  // --- Divisor de voltaje, RE desacoplado en AC ---------------------------
  function voltageDivider(c) {
    var VCC = c.VCC, R1 = c.R1, R2 = c.R2, RC = c.RC, RE = c.RE, beta = c.beta;
    var betaRE = beta * RE, R10R2 = 10 * R2;
    var aprox = betaRE >= R10R2;
    var VB, IB, IC, IE, metodo;
    if (aprox) {
      VB = VCC * R2 / (R1 + R2);
      var VE = VB - VBE;
      IE = VE / RE; IC = IE; IB = IC / beta;
      metodo = "aproximado";
    } else {
      // Thévenin exacto
      var Rth = par(R1, R2), Vth = VCC * R2 / (R1 + R2);
      IB = (Vth - VBE) / (Rth + (beta + 1) * RE);
      IC = beta * IB; IE = (beta + 1) * IB;
      VB = Vth - IB * Rth;
      metodo = "exacto (Thévenin)";
    }
    var VE2 = VB - VBE;
    var re = VT / IE;
    var VCE = VCC - IC * (RC + RE);
    var betaRe = beta * re;
    var Zi = 1 / (1 / R1 + 1 / R2 + 1 / betaRe);
    return {
      dc: { VB: VB, VE: VE2, IB: IB, IC: IC, IE: IE, re: re, VCE: VCE, metodo: metodo },
      ac: { Av: -RC / re, Zi: Zi, Zo: RC, betaRe: betaRe },
      check: { betaRE: betaRE, diezR2: R10R2, aproxValido: aprox }
    };
  }

  // --- Polarización por RB única (emitter-bias), RE desacoplado en AC -----
  function emitterBias(c) {
    var VCC = c.VCC, RB = c.RB, RC = c.RC, RE = c.RE, beta = c.beta;
    var IB = (VCC - VBE) / (RB + (beta + 1) * RE);
    var IC = beta * IB, IE = (beta + 1) * IB;
    var re = VT / IE;
    var VCE = VCC - IC * RC - IE * RE;
    var betaRe = beta * re;
    var Zi = par(RB, betaRe);
    return {
      dc: { IB: IB, IC: IC, IE: IE, re: re, VCE: VCE },
      ac: { Av: -RC / re, Zi: Zi, Zo: RC, betaRe: betaRe }
    };
  }

  // --- Realimentación de colector, RE SIN desacoplar ----------------------
  function collectorFeedback(c) {
    var VCC = c.VCC, RF = c.RF, RC = c.RC, RE = c.RE, beta = c.beta;
    var IB = (VCC - VBE) / (RF + beta * (RC + RE));
    var IC = beta * IB, IE = (beta + 1) * IB;
    var re = VT / IE;
    var VCE = VCC - IC * RC - IE * RE;
    var Zb = beta * re + (beta + 1) * RE;            // impedancia mirando a la base
    // Solución nodal exacta (realimentación a través de RF):
    var Av = (1 / RF - beta / Zb) / (1 / RF + 1 / RC);
    var AvSimple = -RC / (re + RE);                  // aprox. de cálculo a mano
    var Zi = 1 / (1 / Zb + (1 - Av) / RF);
    var ZiSimple = 1 / (1 / Zb + (1 - AvSimple) / RF);
    var Zo = par(RC, RF);
    return {
      dc: { IB: IB, IC: IC, IE: IE, re: re, VCE: VCE },
      ac: { Av: Av, AvSimple: AvSimple, Zi: Zi, ZiSimple: ZiSimple, Zo: Zo, betaRe: beta * re, Zb: Zb }
    };
  }

  var TOPOS = {
    voltage_divider: voltageDivider,
    emitter_bias: emitterBias,
    collector_feedback: collectorFeedback
  };

  function solve(c) {
    var fn = TOPOS[c.topologia];
    if (!fn) throw new Error("Topología desconocida: " + c.topologia);
    var r = fn(c);
    r.topologia = c.topologia;
    return r;
  }

  // Máxima excursión simétrica de salida (pico) para el dibujo de ondas.
  // Limitada por VCE (saturación) y por la caída en RC (corte).
  function maxSwing(res, c) {
    var VCE = res.dc.VCE, IC = res.dc.IC, RC = c.RC;
    var hastaSat = VCE;          // antes de saturar
    var hastaCorte = IC * RC;    // antes de cortar
    return Math.max(0, Math.min(hastaSat, hastaCorte));
  }

  var api = { solve: solve, par: par, maxSwing: maxSwing, VBE: VBE, VT: VT };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BJT = api;
})(typeof window !== "undefined" ? window : globalThis);
