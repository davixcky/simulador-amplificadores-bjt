import React from "react";
import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Intro } from "./scenes/Intro";
import { CircuitScene } from "./scenes/CircuitScene";
import { Outro } from "./scenes/Outro";
import { CIRCUITOS } from "./data";
import { CIRCUIT_ACCENTS, COLORS } from "./theme";

// Duraciones por escena (en frames, a 30 fps).
export const INTRO_DUR = 95;
export const CIRCUIT_DUR = 185;
export const OUTRO_DUR = 95;
export const TRANSITION_DUR = 18;

// Total = suma de escenas - suma de transiciones.
export const TOTAL_FRAMES =
  INTRO_DUR + CIRCUIT_DUR * 3 + OUTRO_DUR - TRANSITION_DUR * 4; // 673

export const BjtVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_DUR}>
          <Intro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DUR })}
        />

        <TransitionSeries.Sequence durationInFrames={CIRCUIT_DUR}>
          <CircuitScene
            circuito={CIRCUITOS[0]}
            index={1}
            accent={CIRCUIT_ACCENTS[CIRCUITOS[0].id]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DUR })}
        />

        <TransitionSeries.Sequence durationInFrames={CIRCUIT_DUR}>
          <CircuitScene
            circuito={CIRCUITOS[1]}
            index={2}
            accent={CIRCUIT_ACCENTS[CIRCUITOS[1].id]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DUR })}
        />

        <TransitionSeries.Sequence durationInFrames={CIRCUIT_DUR}>
          <CircuitScene
            circuito={CIRCUITOS[2]}
            index={3}
            accent={CIRCUIT_ACCENTS[CIRCUITOS[2].id]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DUR })}
        />

        <TransitionSeries.Sequence durationInFrames={OUTRO_DUR}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
