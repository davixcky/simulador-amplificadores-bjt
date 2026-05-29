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

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });
  const repo = spring({ frame: frame - 12, fps, config: { damping: 18 } });
  const made = spring({ frame: frame - 24, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill>
      <Background accent={COLORS.accent2} />
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
            fontSize: 54,
            fontWeight: 800,
            color: COLORS.text,
            transform: `scale(${0.85 + logo * 0.15})`,
            opacity: logo,
            display: "flex",
            gap: 22,
            alignItems: "center",
          }}
        >
          <span style={{ color: COLORS.accent }}>‹/›</span>
          <span>Simulador de Amplificadores BJT</span>
        </div>

        <div
          style={{
            marginTop: 30,
            fontFamily: MONO_STACK,
            fontSize: 34,
            fontWeight: 700,
            color: COLORS.accent,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${COLORS.panelBorder}`,
            borderRadius: 999,
            padding: "16px 34px",
            opacity: repo,
            transform: `translateY(${(1 - repo) * 20}px)`,
          }}
        >
          github.com/davixcky/simulador-amplificadores-bjt
        </div>

        <div
          style={{
            marginTop: 40,
            fontFamily: FONT_STACK,
            fontSize: 26,
            color: COLORS.textDim,
            opacity: made,
          }}
        >
          Hecho con Remotion · React
        </div>

        <div
          style={{
            marginTop: 14,
            height: 4,
            width: interpolate(frame, [20, 55], [0, 460], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            background: `linear-gradient(90deg, ${COLORS.accent2}, ${COLORS.accent})`,
            borderRadius: 4,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
