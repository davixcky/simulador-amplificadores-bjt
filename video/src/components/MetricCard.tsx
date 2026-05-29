import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_STACK, MONO_STACK } from "../theme";

type Props = {
  label: string;
  value: string;
  sub?: string;
  startFrame: number;
  delay: number;
  accent: string;
  highlight?: boolean;
};

export const MetricCard: React.FC<Props> = ({
  label,
  value,
  sub,
  startFrame,
  delay,
  accent,
  highlight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame - delay;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 120 },
  });
  const opacity = spring({
    frame: local,
    fps,
    config: { damping: 200 },
  });
  const translateY = (1 - enter) * 36;
  const scale = 0.9 + enter * 0.1;

  return (
    <div
      style={{
        background: highlight
          ? "rgba(255,255,255,0.10)"
          : "rgba(255,255,255,0.05)",
        border: `1px solid ${highlight ? accent : COLORS.panelBorder}`,
        borderRadius: 16,
        padding: "14px 18px",
        minWidth: 168,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: highlight ? `0 0 26px ${accent}33` : "none",
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          color: COLORS.textDim,
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: MONO_STACK,
          color: highlight ? accent : COLORS.text,
          fontSize: 33,
          fontWeight: 800,
          lineHeight: 1.15,
          marginTop: 2,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: MONO_STACK,
            color: COLORS.textDim,
            fontSize: 16,
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
