import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

// Fondo con degradado y un sutil patron de rejilla en movimiento.
export const Background: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.25) % 60;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 70% -10%, ${accent}22, transparent 60%), linear-gradient(160deg, ${COLORS.bg} 0%, ${COLORS.bgAlt} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: `${shift}px ${shift}px`,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
