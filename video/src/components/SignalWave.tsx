import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT_STACK, MONO_STACK } from "../theme";

type Props = {
  Av: number; // ganancia (con signo). Negativa => inversion de fase.
  // frame local de la escena en que empieza a dibujarse la onda
  startFrame: number;
  drawDuration: number; // frames para "dibujar" el trazo
  accent: string;
  width?: number;
};

const H = 188;
const PAD_L = 56;
const PAD_R = 24;
const MID = H / 2;

// Genera el atributo "d" de un path senoidal recortado hasta progress (0..1).
function sinePath(
  amplitude: number,
  cycles: number,
  phaseInverted: boolean,
  progress: number,
  animPhase: number,
  plotW: number
): string {
  const points: string[] = [];
  const totalSamples = 140;
  const visible = Math.max(2, Math.floor(totalSamples * progress));
  for (let i = 0; i < visible; i++) {
    const t = i / (totalSamples - 1);
    const x = PAD_L + t * plotW;
    const angle = t * cycles * Math.PI * 2 + animPhase;
    const sign = phaseInverted ? -1 : 1;
    const y = MID - sign * amplitude * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
}

export const SignalWave: React.FC<Props> = ({
  Av,
  startFrame,
  drawDuration,
  accent,
  width = 420,
}) => {
  const W = width;
  const PLOT_W = W - PAD_L - PAD_R;
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  // Progreso del dibujado (se traza de izquierda a derecha).
  const draw = interpolate(local, [0, drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Pequeno desplazamiento de fase para que las ondas "vivan" un poco.
  const animPhase = local * 0.06;

  // Amplitudes: la entrada es pequena; la salida = entrada * |Av|, recortada
  // visualmente al alto del panel (la ganancia se muestra como factor).
  const inAmp = 22;
  const cap = MID - 30; // no salirse del panel
  const outAmpRaw = inAmp * Math.min(Math.abs(Av), 60); // escala visual
  const outAmp = Math.min(outAmpRaw, cap);
  const recortada = outAmpRaw > cap;

  const phaseInverted = Av < 0;

  const dIn = sinePath(inAmp, 3, false, draw, animPhase, PLOT_W);
  const dOut = sinePath(outAmp, 3, phaseInverted, draw, animPhase, PLOT_W);

  // Opacidad de la leyenda de inversion (entra al final del dibujo).
  const noteOpacity = interpolate(local, [drawDuration * 0.6, drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: W }}>
      <div
        style={{
          fontFamily: FONT_STACK,
          color: COLORS.textDim,
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 5,
          letterSpacing: 0.3,
        }}
      >
        Señal: entrada vs. salida
      </div>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 16,
          border: `1px solid ${COLORS.panelBorder}`,
        }}
      >
        {/* eje horizontal (linea de referencia v=0) */}
        <line
          x1={PAD_L}
          y1={MID}
          x2={W - PAD_R}
          y2={MID}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />
        {/* etiquetas de eje */}
        <text
          x={14}
          y={MID + 5}
          fill={COLORS.textDim}
          fontSize={18}
          fontFamily={MONO_STACK}
        >
          0V
        </text>

        {/* onda de salida (detras, amplitud grande) */}
        <path
          d={dOut}
          fill="none"
          stroke={COLORS.wireOut}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.95}
        />
        {/* onda de entrada (delante, amplitud pequena) */}
        <path
          d={dIn}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>

      {/* leyenda */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 8,
          fontFamily: FONT_STACK,
          fontSize: 18,
          opacity: noteOpacity,
        }}
      >
        <span style={{ color: accent, fontWeight: 700 }}>● Entrada (Vi)</span>
        <span style={{ color: COLORS.wireOut, fontWeight: 700 }}>
          ● Salida (Vo) ×{Math.abs(Av) >= 100 ? Av.toFixed(0) : Av.toFixed(1)}
        </span>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: FONT_STACK,
          fontSize: 19,
          color: phaseInverted ? COLORS.warn : COLORS.green,
          fontWeight: 700,
          opacity: noteOpacity,
        }}
      >
        {phaseInverted
          ? "↺ Inversión de fase 180° (Av < 0)"
          : "En fase (Av > 0)"}
        {recortada ? "  ·  amplitud a escala" : ""}
      </div>
    </div>
  );
};
