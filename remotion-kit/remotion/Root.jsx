import React from 'react';
import { Composition } from 'remotion';
import { MyComposition } from './Composition.jsx';
import { PromoVertical, PromoVerticalDuration } from './PromoVertical.jsx';

const FPS = 30;

const durationFromProps = ({ props }) => {
  const total = Number(props?.totalDurationSec) || 0;
  const segments = Array.isArray(props?.timestampSegments) ? props.timestampSegments : [];
  const last = segments.reduce((max, seg) => Math.max(max, Number(seg?.endSec) || 0), total);
  return {
    durationInFrames: Math.max(PromoVerticalDuration, Math.ceil((last + 1) * FPS))
  };
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MyComposition"
        component={MyComposition}
        durationInFrames={90}
        calculateMetadata={durationFromProps}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="PromoVertical"
        component={PromoVertical}
        durationInFrames={PromoVerticalDuration}
        calculateMetadata={durationFromProps}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
};
