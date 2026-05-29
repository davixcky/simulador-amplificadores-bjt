# Apuntes de análisis — Amplificadores BJT (modelo r_e)

Desarrollo **paso a paso** del análisis DC y AC de los tres circuitos del laboratorio. Todos los números coinciden con [`../datos/circuitos.json`](../datos/circuitos.json), que es la fuente de verdad.

## Convenciones y supuestos

- **`VBE = 0.7 V`** — caída de la unión base-emisor en conducción.
- **`VT = 26 mV`** — tensión térmica; define la resistencia dinámica de emisor `r_e = VT / I_E`.
- **`ro = ∞`** — se desprecia el efecto Early; por eso `Z_o ≈ RC` en las configuraciones sin realimentación.
- **Método aproximado del divisor:** válido cuando `β·RE ≥ 10·R2` (la corriente de base es despreciable frente a la del divisor).

### Idea general del método de dos pasos

1. **Análisis DC.** Apagamos la fuente de señal y tratamos los condensadores como **circuitos abiertos**. Calculamos el punto de operación (*punto Q*): `I_B`, `I_C`, `I_E` y `V_CE`. De ahí sale el dato clave para AC: `r_e = 26mV / I_E`.
2. **Análisis AC.** Cortocircuitamos la fuente DC (`VCC → masa para la señal`) y los condensadores de acoplo (se comportan como cortos a la frecuencia de trabajo). Sustituimos el transistor por su **modelo r_e** y obtenemos la ganancia `A_v`, la impedancia de entrada `Z_i` y la de salida `Z_o`.

El puente entre ambos mundos es `r_e`: **el punto Q (DC) fija la pendiente de señal pequeña (AC)**.

---

## Circuito 1 — Realimentación de colector (RE *sin* desacoplar)

**Datos:** `VCC = 10 V`, `RF = 250 kΩ`, `RC = 4.7 kΩ`, `RE = 1.2 kΩ`, `β = 90`.
`RE` **no** lleva condensador de emisor, así que aparece tanto en DC como en AC.

### Análisis DC

La realimentación de colector toma la tensión de base **desde el colector** a través de `RF`. Al plantear la malla base-emisor, `RF` ve circular `I_B`, mientras que por `RC` y `RE` circula prácticamente `I_C ≈ I_E ≈ β·I_B`. Reflejando esas caídas al lazo de base aparece el término `β·(RC+RE)`:

1. **Corriente de base.** Se usa esta fórmula porque la realimentación hace que la caída en `RC+RE` (vista por `I_C`) entre en el lazo multiplicada por `β`:

   `I_B = (VCC − VBE) / (RF + β·(RC+RE)) = (10 − 0.7) / (250k + 90·5.9k) ≈ 11.9 µA`

2. **Corriente de colector.** `I_C = β·I_B = 90 · 11.9µ ≈ 1.07 mA`

3. **Corriente de emisor.** `I_E = (β+1)·I_B = 91 · 11.9µ ≈ 1.08 mA`

4. **Resistencia dinámica de emisor.** `r_e = 26mV / I_E = 26m / 1.08m ≈ 24 Ω`

5. **Tensión colector-emisor.** `V_CE = VCC − I_C·RC − I_E·RE = 10 − 5.04 − 1.30 ≈ 3.66 V`

> **Valores de referencia:** `I_B = 11.908 µA`, `I_C = 1.0717 mA`, `I_E = 1.0836 mA`, `r_e = 23.99 Ω`, `V_CE = 3.663 V`.

### Análisis AC

Como **`RE` no está desacoplado**, permanece en serie con `r_e` en la trayectoria de emisor. Esto introduce **realimentación de corriente (degeneración de emisor)**: cada incremento de corriente sube la tensión de emisor y se opone a la señal de entrada, lo que **reduce drásticamente la ganancia** pero la hace mucho más estable y lineal.

1. **Ganancia de tensión (cálculo a mano).** El denominador incluye `RE` precisamente porque no está desacoplado:

   `A_v = −RC / (r_e + RE) = −4.7k / 1.224k ≈ −3.84`

   El signo negativo indica inversión de fase. Compárese con el circuito 2, donde con `RE` desacoplado la ganancia salta a centenares.

2. **Impedancia de entrada.** La base ve `Zb = β·r_e + (β+1)·RE ≈ 110 kΩ` (el `RE` no desacoplado se refleja amplificado por `β+1`), en paralelo con la realimentación `RF/(1−A_v)` (efecto Miller de `RF`):

   `Z_i = β(r_e+RE) ∥ RF/(1−A_v) = 110k ∥ 51.7k ≈ 35.2 kΩ`

3. **Impedancia de salida.** Mirando desde el colector se ven `RC` y `RF` en paralelo:

   `Z_o = RC ∥ RF = 4.7k ∥ 250k ≈ 4.61 kΩ`

> **Modelo nodal exacto.** Resolviendo el nodo de colector con la realimentación completa por `RF` se obtiene `A_v ≈ −3.71` y `Z_i ≈ 35 950 Ω`. La realimentación a través de `RF` resta un poco más de ganancia que la aproximación a mano (−3.84 / `Z_i` 35 170 Ω). Por eso el JSON guarda ambas: `A_v = −3.71` (exacto) y `Av_simple = −3.84`.

> **Valores de referencia:** `A_v = −3.71` (simple −3.84), `Z_i = 35 950 Ω` (simple 35 170 Ω), `Z_o = 4 613 Ω`.

---

## Circuito 2 — Divisor de voltaje (RE desacoplado)

**Datos:** `VCC = 22 V`, `R1 = 39 kΩ`, `R2 = 3.9 kΩ`, `RC = 10 kΩ`, `RE = 1.5 kΩ`, `β = 100`, `CE = 50 µF`.

### Comprobación del método aproximado

Antes de calcular hay que verificar si podemos usar el atajo del divisor:

`β·RE = 100 · 1.5k = 150 kΩ` ≥ `10·R2 = 10 · 3.9k = 39 kΩ` → **se cumple**, el método aproximado es válido. (Si no se cumpliera, habría que usar el equivalente de Thévenin de `R1∥R2`.)

### Análisis DC

El divisor `R1`-`R2` fija una tensión de base casi independiente de `β`, lo que da un punto Q muy estable.

1. **Tensión de base.** Con `I_B` despreciable, el divisor actúa sin carga:

   `V_B = VCC·R2 / (R1+R2) = 22·3.9k / 42.9k ≈ 2.0 V`

2. **Tensión de emisor.** `V_E = V_B − VBE = 2.0 − 0.7 = 1.3 V`

3. **Corriente de emisor.** Cae sobre `RE`:

   `I_E = V_E / RE = 1.3 / 1.5k ≈ 0.867 mA`

4. **Corriente de colector.** `I_C ≈ I_E ≈ 0.867 mA`

5. **Resistencia dinámica de emisor.** `r_e = 26mV / I_E = 26m / 0.867m ≈ 30 Ω`

6. **Tensión colector-emisor.** En DC `RE` sigue presente:

   `V_CE = VCC − I_C·(RC + RE) = 22 − 0.867m·11.5k ≈ 12.03 V`

> **Valores de referencia:** `V_B = 2.0 V`, `V_E = 1.3 V`, `I_B = 8.667 µA`, `I_C = I_E = 0.8667 mA`, `r_e = 30.0 Ω`, `V_CE = 12.033 V`.

### Análisis AC

Aquí **`RE` está desacoplado** por `CE = 50 µF`: a la frecuencia de señal el condensador es un corto y pone el emisor a masa para AC. Como ya **no** hay degeneración de emisor, la trayectoria de emisor se reduce a `r_e` solo, y **la ganancia se dispara**.

1. **Ganancia de tensión.** Sin `RE` en AC, el denominador es únicamente `r_e`:

   `A_v = −RC / r_e = −10k / 30 ≈ −333`

   Compárese con el circuito 1 (−3.84 con `RE` presente): **desacoplar `RE` multiplica la ganancia por ~RE/r_e**, a costa de más distorsión y dependencia del punto Q.

2. **Impedancia de entrada.** La base, ahora sin el `RE` reflejado, presenta solo `β·r_e`, en paralelo con el divisor:

   `Z_i = R1 ∥ R2 ∥ β·r_e = 39k ∥ 3.9k ∥ 3k ≈ 1.63 kΩ`

   (`β·r_e = 100·30 = 3 kΩ` es el término dominante por ser el más pequeño.)

3. **Impedancia de salida.** Con `ro = ∞`: `Z_o = RC = 10 kΩ`

> **Valores de referencia:** `A_v = −333.3`, `Z_i = 1 625 Ω`, `Z_o = 10 000 Ω`.

---

## Circuito 3 — Polarización de emisor (RB única, RE desacoplado)

**Datos:** `VCC = 20 V`, `RB = 430 kΩ`, `RC = 2 kΩ`, `RE = 1 kΩ`, `β = 50`, `CE = 40 µF`.

### Análisis DC

La polarización es por una **única resistencia de base** `RB`. `RE` está presente en DC y estabiliza el punto Q: si `I_C` tiende a crecer, `V_E` sube y reduce `VBE`, frenando el aumento (realimentación negativa de corriente). El término `(β+1)·RE` en el lazo de base refleja ese `RE` visto desde la base.

1. **Corriente de base.** `RE` se refleja al lazo de base multiplicado por `(β+1)`:

   `I_B = (VCC − VBE) / (RB + (β+1)·RE) = (20 − 0.7) / (430k + 51·1k) ≈ 40.1 µA`

2. **Corriente de colector.** `I_C = β·I_B = 50 · 40.1µ ≈ 2.01 mA`

3. **Corriente de emisor.** `I_E = (β+1)·I_B = 51 · 40.1µ ≈ 2.05 mA`

4. **Resistencia dinámica de emisor.** `r_e = 26mV / I_E = 26m / 2.05m ≈ 12.7 Ω`

5. **Tensión colector-emisor.** `V_CE = VCC − I_C·RC − I_E·RE = 20 − 4.01 − 2.05 ≈ 13.94 V`

> **Valores de referencia:** `I_B = 40.125 µA`, `I_C = 2.0062 mA`, `I_E = 2.0464 mA`, `r_e = 12.71 Ω`, `V_CE = 13.941 V`.

### Análisis AC

Igual que en el circuito 2, **`RE` está desacoplado** (`CE = 40 µF`): estabiliza en DC pero en AC queda cortocircuitado a masa, así que no participa en la ganancia.

1. **Ganancia de tensión.** Solo `r_e` en la trayectoria de emisor:

   `A_v = −RC / r_e = −2k / 12.7 ≈ −157`

2. **Impedancia de entrada.** Sin divisor; la única resistencia de polarización es `RB`, en paralelo con `β·r_e`:

   `Z_i = RB ∥ β·r_e = 430k ∥ 635 ≈ 635 Ω`

   (`β·r_e = 50·12.7 ≈ 635 Ω`; como `RB = 430 kΩ` es enorme, casi no afecta y `Z_i ≈ β·r_e`.)

3. **Impedancia de salida.** `Z_o = RC = 2 kΩ`

> **Valores de referencia:** `A_v = −157.4`, `Z_i = 634.3 Ω`, `Z_o = 2 000 Ω`.

---

## Resumen: el efecto de desacoplar (o no) RE en la ganancia

Este es el concepto central que conecta los tres circuitos:

| Circuito | RE en AC | Ganancia `A_v` | Denominador |
|----------|----------|---------------:|-------------|
| 1 — Realimentación de colector | **presente** (sin desacoplar) | ≈ −3.71 | `r_e + RE` |
| 2 — Divisor de voltaje | desacoplado (`CE`) | −333.3 | `r_e` |
| 3 — Polarización de emisor | desacoplado (`CE`) | −157.4 | `r_e` |

- **Con `RE` desacoplado** (circuitos 2 y 3): el condensador `CE` pone el emisor a masa en AC, el denominador de la ganancia es solo `r_e` y como `r_e` vale apenas decenas de ohmios, `A_v = −RC/r_e` resulta **muy grande** (cientos). El precio: la ganancia depende fuertemente del punto Q (de `r_e`, que cambia con la temperatura y `β`) y hay **más distorsión**.

- **Sin desacoplar `RE`** (circuito 1): `RE` queda en serie con `r_e` y el denominador pasa a ser `r_e + RE`. Como `RE` (kΩ) ≫ `r_e` (decenas de Ω), la ganancia cae a unas pocas unidades. A cambio se gana **estabilidad, linealidad e impedancia de entrada mucho mayor**, porque `RE` se refleja a la base como `(β+1)·RE`. Es el clásico compromiso **ganancia vs. estabilidad** que introduce la realimentación de corriente (degeneración de emisor).
