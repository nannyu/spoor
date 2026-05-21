import React from 'react';
import { Composition } from 'remotion';
import { MyComposition } from './Composition.jsx';
import { PromoVertical, PromoVerticalDuration } from './PromoVertical.jsx';
import { SpoorPromo, SpoorPromoDuration } from './SpoorPromo.jsx';
import spoorPromoDefaults from './spoor-promo.json';

const FPS = 30;

const durationFromProps = ({ props }, minFrames) => {
  const total = Number(props?.totalDurationSec) || 0;
  const segments = Array.isArray(props?.timestampSegments) ? props.timestampSegments : [];
  const last = segments.reduce((max, seg) => Math.max(max, Number(seg?.endSec) || 0), total);
  return {
    durationInFrames: Math.max(minFrames, Math.ceil((last + 1) * FPS)),
  };
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MyComposition"
        component={MyComposition}
        durationInFrames={90}
        calculateMetadata={(meta) => durationFromProps(meta, 90)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="PromoVertical"
        component={PromoVertical}
        durationInFrames={PromoVerticalDuration}
        calculateMetadata={(meta) => durationFromProps(meta, PromoVerticalDuration)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
      <Composition
        id="SpoorPromo"
        component={SpoorPromo}
        durationInFrames={SpoorPromoDuration}
        calculateMetadata={(meta) => durationFromProps(meta, SpoorPromoDuration)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={spoorPromoDefaults}
      />
    </>
  );
};
