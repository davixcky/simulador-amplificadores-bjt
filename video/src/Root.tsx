import React from "react";
import { Composition } from "remotion";
import { BjtVideo, TOTAL_FRAMES } from "./BjtVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BJT"
        component={BjtVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
