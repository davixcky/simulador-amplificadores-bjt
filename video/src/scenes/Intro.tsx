import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "../components/Background";
import { COLORS, FONT_STACK, MONO_STACK } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 110 },
  });
  const titleY = (1 - titleSpring) * 50;

  const subSpring = spring({
    frame: frame - 14,
    fps,
    config: { damping: 18 },
  });

  const chipSpring = spring({
    frame: frame - 26,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const lineWidth = interpolate(frame, [10, 40], [0, 520], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chips = ["VBE = 0.7 V", "VT = 26 mV", "ro = ∞"];

  return (
    <AbsoluteFill>
      <Background accent={COLORS.accent} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: MONO_STACK,
            color: COLORS.accent,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 6,
            opacity: subSpring,
            marginBottom: 16,
          }}
        >
          ELECTRÓNICA · MODELO r e
        </div>
        <h1
          style={{
            fontFamily: FONT_STACK,
            color: COLORS.text,
            fontSize: 64,
            fontWeight: 800,
            margin: 0,
            transform: `translateY(${titleY}px)`,
            opacity: titleSpring,
            lineHeight: 1.1,
            maxWidth: 1000,
          }}
        >
          Amplificadores BJT
          <br />
          <span style={{ color: COLORS.accent }}>Análisis DC y AC</span>
        </h1>

        <div
          style={{
            height: 4,
            width: lineWidth,
            background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent2})`,
            borderRadius: 4,
            margin: "26px 0",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 18,
            transform: `scale(${0.8 + chipSpring * 0.2})`,
            opacity: chipSpring,
          }}
        >
          {chips.map((c) => (
            <div
              key={c}
              style={{
                fontFamily: MONO_STACK,
                fontSize: 26,
                fontWeight: 700,
                color: COLORS.text,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${COLORS.panelBorder}`,
                borderRadius: 999,
                padding: "12px 24px",
              }}
            >
              {c}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 36,
            fontFamily: FONT_STACK,
            fontSize: 24,
            color: COLORS.textDim,
            opacity: interpolate(frame, [40, 60], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Tres topologías · sus números clave · ganancia e inversión de fase
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
