import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, MONO_STACK } from "../theme";

type Props = {
  topologia: string;
  startFrame: number;
  accent: string;
};

const W = 460;
const H = 380;

// Resistencia dibujada como zig-zag, vertical u horizontal.
const Resistor: React.FC<{
  x: number;
  y: number;
  len: number;
  horizontal?: boolean;
  label: string;
  value: string;
  appear: number;
  color: string;
}> = ({ x, y, len, horizontal, label, value, appear, color }) => {
  const zig = 14;
  const teeth = 6;
  const seg = len / (teeth + 2);
  const pts: string[] = [];
  if (!horizontal) {
    pts.push(`${x},${y}`);
    pts.push(`${x},${y + seg}`);
    for (let i = 0; i < teeth; i++) {
      const yy = y + seg + (i + 0.5) * seg;
      const xx = x + (i % 2 === 0 ? zig : -zig);
      pts.push(`${xx},${yy}`);
    }
    pts.push(`${x},${y + len - seg}`);
    pts.push(`${x},${y + len}`);
  } else {
    pts.push(`${x},${y}`);
    pts.push(`${x + seg},${y}`);
    for (let i = 0; i < teeth; i++) {
      const xx = x + seg + (i + 0.5) * seg;
      const yy = y + (i % 2 === 0 ? zig : -zig);
      pts.push(`${xx},${yy}`);
    }
    pts.push(`${x + len - seg},${y}`);
    pts.push(`${x + len},${y}`);
  }
  return (
    <g opacity={appear}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={COLORS.text}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text
        x={horizontal ? x + len / 2 : x + 22}
        y={horizontal ? y - 16 : y + len / 2 - 4}
        fill={color}
        fontSize={20}
        fontFamily={MONO_STACK}
        fontWeight={700}
        textAnchor={horizontal ? "middle" : "start"}
      >
        {label}
      </text>
      <text
        x={horizontal ? x + len / 2 : x + 22}
        y={horizontal ? y - 16 + 20 : y + len / 2 + 16}
        fill={COLORS.textDim}
        fontSize={16}
        fontFamily={MONO_STACK}
        textAnchor={horizontal ? "middle" : "start"}
      >
        {value}
      </text>
    </g>
  );
};

export const CircuitSchematic: React.FC<Props> = ({
  topologia,
  startFrame,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const sp = (delay: number) =>
    spring({
      frame: local - delay,
      fps,
      config: { damping: 200, mass: 0.8 },
    });

  // Pulso de corriente que viaja por los cables (punto luminoso).
  const flow = (local % 60) / 60;

  // Coordenadas del transistor (NPN) — base izquierda, colector arriba, emisor abajo.
  const bx = 230;
  const by = 190; // centro de la barra vertical del transistor
  const barTop = by - 45;
  const barBot = by + 45;
  const baseX = bx - 60;

  const transistorAppear = sp(4);

  const labels = ((): {
    rTop: { label: string; value: string };
    biasLabel: string;
  } => {
    if (topologia === "voltage_divider")
      return { rTop: { label: "RC", value: "10 kΩ" }, biasLabel: "R1 / R2" };
    if (topologia === "emitter_bias")
      return { rTop: { label: "RC", value: "2 kΩ" }, biasLabel: "RB" };
    return { rTop: { label: "RC", value: "4.7 kΩ" }, biasLabel: "RF" };
  })();

  return (
    <svg width={W * 0.74} height={H * 0.74} viewBox={`0 0 ${W} ${H}`}>
      {/* Riel VCC superior */}
      <g opacity={sp(0)}>
        <line
          x1={90}
          y1={40}
          x2={400}
          y2={40}
          stroke={COLORS.text}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <text x={405} y={46} fill={accent} fontSize={20} fontFamily={MONO_STACK} fontWeight={700}>
          VCC
        </text>
      </g>

      {/* RC: del riel al colector */}
      <Resistor
        x={bx + 30}
        y={50}
        len={75}
        label={labels.rTop.label}
        value={labels.rTop.value}
        appear={sp(8)}
        color={accent}
      />
      {/* cable RC -> colector */}
      <line
        x1={bx + 30}
        y1={40}
        x2={bx + 30}
        y2={50}
        stroke={COLORS.text}
        strokeWidth={3}
        opacity={sp(8)}
      />
      <line
        x1={bx + 30}
        y1={125}
        x2={bx + 30}
        y2={barTop + 8}
        stroke={COLORS.text}
        strokeWidth={3}
        opacity={sp(8)}
      />
      <line
        x1={bx + 30}
        y1={barTop + 8}
        x2={bx + 2}
        y2={barTop + 18}
        stroke={COLORS.text}
        strokeWidth={3}
        opacity={transistorAppear}
      />

      {/* Transistor NPN */}
      <g opacity={transistorAppear}>
        {/* circulo */}
        <circle
          cx={bx}
          cy={by}
          r={62}
          fill="rgba(255,255,255,0.03)"
          stroke={accent}
          strokeWidth={2.5}
        />
        {/* barra de base */}
        <line x1={bx - 2} y1={barTop} x2={bx - 2} y2={barBot} stroke={COLORS.text} strokeWidth={5} />
        {/* base lead */}
        <line x1={baseX} y1={by} x2={bx - 2} y2={by} stroke={COLORS.text} strokeWidth={3} />
        {/* colector lead */}
        <line x1={bx - 2} y1={barTop + 16} x2={bx + 30} y2={barTop + 4} stroke={COLORS.text} strokeWidth={3} />
        {/* emisor lead + flecha (NPN apunta hacia afuera) */}
        <line x1={bx - 2} y1={barBot - 16} x2={bx + 30} y2={barBot + 6} stroke={COLORS.text} strokeWidth={3} />
        <polygon
          points={`${bx + 30},${barBot + 6} ${bx + 16},${barBot} ${bx + 18},${barBot + 14}`}
          fill={COLORS.text}
        />
        {/* etiquetas C B E */}
        <text x={bx + 36} y={barTop + 8} fill={COLORS.textDim} fontSize={16} fontFamily={MONO_STACK}>C</text>
        <text x={baseX - 18} y={by - 8} fill={COLORS.textDim} fontSize={16} fontFamily={MONO_STACK}>B</text>
        <text x={bx + 36} y={barBot + 16} fill={COLORS.textDim} fontSize={16} fontFamily={MONO_STACK}>E</text>
      </g>

      {/* Red de polarizacion de base (etiqueta) */}
      <g opacity={sp(12)}>
        <line x1={120} y1={by} x2={baseX} y2={by} stroke={COLORS.text} strokeWidth={3} />
        <circle cx={120} cy={by} r={5} fill={accent} />
        <text x={70} y={by - 14} fill={accent} fontSize={20} fontFamily={MONO_STACK} fontWeight={700}>
          {labels.biasLabel}
        </text>
        <text x={70} y={by + 28} fill={COLORS.textDim} fontSize={15} fontFamily={MONO_STACK}>
          base
        </text>
      </g>

      {/* RE: del emisor a tierra */}
      <line
        x1={bx + 30}
        y1={barBot + 6}
        x2={bx + 30}
        y2={265}
        stroke={COLORS.text}
        strokeWidth={3}
        opacity={sp(14)}
      />
      <Resistor
        x={bx + 30}
        y={265}
        len={60}
        label="RE"
        value={
          topologia === "voltage_divider"
            ? "1.5 kΩ"
            : topologia === "emitter_bias"
            ? "1 kΩ"
            : "1.2 kΩ"
        }
        appear={sp(14)}
        color={accent}
      />
      {/* tierra */}
      <g opacity={sp(16)}>
        <line x1={bx + 30} y1={325} x2={bx + 30} y2={345} stroke={COLORS.text} strokeWidth={3} />
        <line x1={bx + 10} y1={345} x2={bx + 50} y2={345} stroke={COLORS.text} strokeWidth={3} />
        <line x1={bx + 18} y1={352} x2={bx + 42} y2={352} stroke={COLORS.text} strokeWidth={3} />
        <line x1={bx + 25} y1={359} x2={bx + 35} y2={359} stroke={COLORS.text} strokeWidth={3} />
      </g>

      {/* Punto de corriente animado bajando por RC */}
      <circle
        cx={bx + 30}
        cy={interpolate(flow, [0, 1], [50, 125])}
        r={5}
        fill={COLORS.warn}
        opacity={transistorAppear * 0.9}
      />

      {/* Nodo de salida (colector) */}
      <g opacity={sp(10)}>
        <circle cx={bx + 30} cy={125} r={5} fill={COLORS.wireOut} />
        <line x1={bx + 30} y1={125} x2={400} y2={125} stroke={COLORS.wireOut} strokeWidth={2} strokeDasharray="5 5" />
        <text x={405} y={120} fill={COLORS.wireOut} fontSize={18} fontFamily={MONO_STACK} fontWeight={700}>
          Vo
        </text>
      </g>
      {/* Nodo de entrada (base) */}
      <g opacity={sp(12)}>
        <text x={20} y={by + 50} fill={accent} fontSize={18} fontFamily={MONO_STACK} fontWeight={700}>
          Vi →
        </text>
      </g>
    </svg>
  );
};
