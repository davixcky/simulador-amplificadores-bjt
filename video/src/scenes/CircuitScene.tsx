import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { CircuitSchematic } from "../components/CircuitSchematic";
import { MetricCard } from "../components/MetricCard";
import { SignalWave } from "../components/SignalWave";
import {
  Circuito,
  fmtCorriente,
  fmtGanancia,
  fmtOhm,
  fmtVolt,
} from "../data";
import { COLORS, FONT_STACK, MONO_STACK } from "../theme";

type Props = {
  circuito: Circuito;
  index: number; // 1..3
  accent: string;
};

export const CircuitScene: React.FC<Props> = ({ circuito, index, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const header = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 120 },
  });
  const headerX = (1 - header) * -60;

  const sub = spring({ frame: frame - 8, fps, config: { damping: 20 } });

  const av = circuito.ac.Av;

  return (
    <AbsoluteFill>
      <Background accent={accent} />
      <AbsoluteFill style={{ padding: "44px 56px" }}>
        {/* Cabecera */}
        <div style={{ transform: `translateX(${headerX}px)`, opacity: header }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                fontFamily: MONO_STACK,
                fontSize: 34,
                fontWeight: 800,
                color: COLORS.bg,
                background: accent,
                borderRadius: 14,
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index}
            </div>
            <div>
              <h2
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 44,
                  fontWeight: 800,
                  color: COLORS.text,
                  margin: 0,
                  lineHeight: 1.05,
                }}
              >
                {circuito.nombre}
              </h2>
              <div
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 23,
                  color: accent,
                  fontWeight: 600,
                  marginTop: 4,
                  opacity: sub,
                }}
              >
                {circuito.subtitulo}
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo: a la izquierda esquema (arriba) + senal (abajo); a la
            derecha las metricas en rejilla. */}
        <div
          style={{
            display: "flex",
            gap: 36,
            marginTop: 18,
            flex: 1,
          }}
        >
          {/* Columna izquierda: esquema + senal apilados */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              width: 540,
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <CircuitSchematic
                topologia={circuito.topologia}
                startFrame={0}
                accent={accent}
              />
            </div>
            <div style={{ marginTop: -8 }}>
              <SignalWave
                Av={av}
                startFrame={28}
                drawDuration={70}
                accent={accent}
                width={520}
              />
            </div>
          </div>

          {/* Columna derecha: metricas */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 21,
                fontWeight: 700,
                color: COLORS.textDim,
                letterSpacing: 3,
                opacity: interpolate(frame, [18, 30], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              ANÁLISIS DC
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MetricCard
                label="IC"
                value={fmtCorriente(circuito.dc.IC)}
                startFrame={0}
                delay={22}
                accent={accent}
              />
              <MetricCard
                label="VCE"
                value={fmtVolt(circuito.dc.VCE)}
                startFrame={0}
                delay={28}
                accent={accent}
              />
              <MetricCard
                label="r e = 26mV/IE"
                value={fmtOhm(circuito.dc.re)}
                startFrame={0}
                delay={34}
                accent={accent}
              />
            </div>

            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 21,
                fontWeight: 700,
                color: COLORS.textDim,
                letterSpacing: 3,
                marginTop: 8,
                opacity: interpolate(frame, [44, 56], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              ANÁLISIS AC
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MetricCard
                label="Av (ganancia)"
                value={fmtGanancia(av)}
                sub={av < 0 ? "invierte la fase" : "en fase"}
                startFrame={0}
                delay={48}
                accent={accent}
                highlight
              />
              <MetricCard
                label="Zi"
                value={fmtOhm(circuito.ac.Zi)}
                startFrame={0}
                delay={54}
                accent={accent}
              />
              <MetricCard
                label="Zo"
                value={fmtOhm(circuito.ac.Zo)}
                startFrame={0}
                delay={58}
                accent={accent}
              />
            </div>
          </div>
        </div>

        {/* Nota al pie */}
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 18,
            color: COLORS.textDim,
            opacity: interpolate(frame, [100, 120], [0, 0.9], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            borderLeft: `3px solid ${accent}`,
            paddingLeft: 14,
            maxWidth: 1160,
          }}
        >
          {circuito.nota}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
