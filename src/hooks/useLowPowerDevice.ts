import { useEffect, useState } from 'react';

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Conservative capability probe used to trim particle counts and cap the
 * canvas pixel ratio. Any device reporting limited cores or memory, or a
 * narrow viewport, gets the lighter render path.
 */
export function useLowPowerDevice(): boolean {
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const nav = navigator as NavigatorWithMemory;
    const cores = nav.hardwareConcurrency ?? 8;
    const memory = nav.deviceMemory ?? 8;
    const smallScreen = window.matchMedia?.('(max-width: 720px)').matches ?? false;
    setLowPower(cores <= 4 || memory <= 4 || smallScreen);
  }, []);

  return lowPower;
}
