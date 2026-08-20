export type LandingParallaxEnvironment = {
  viewportWidth: number;
  prefersReducedMotion: boolean;
};

export const shouldApplyLandingParallax = ({ viewportWidth, prefersReducedMotion }: LandingParallaxEnvironment) =>
  viewportWidth > 600 && !prefersReducedMotion;

export const getLandingParallaxOffsets = (pointerXRatio: number, pointerYRatio: number) => {
  const x = (pointerXRatio - 0.5) * 8;
  const y = (pointerYRatio - 0.5) * 8;
  return {
    workspace: [x * 0.4, y * 0.4],
    browser: [x * 0.7, y * 0.7],
    phone: [x, y],
    insight: [x * 0.8, y * 0.8],
    impact: [x * 0.65, y * 0.65],
    badge: [x * 0.45, y * 0.45],
    connector: [x * 0.35, y * 0.35],
  } as const;
};

type MotionElement = { style: { setProperty: (name: string, value: string) => void } };
type MontageRoot = { querySelector: <T extends MotionElement>(selector: string) => T | null };

export const applyLandingParallaxToMontage = (
  root: MontageRoot,
  environment: LandingParallaxEnvironment,
  pointerXRatio: number,
  pointerYRatio: number,
) => {
  if (!shouldApplyLandingParallax(environment)) return false;
  const offsets = getLandingParallaxOffsets(pointerXRatio, pointerYRatio);
  Object.entries(offsets).forEach(([layer, [x, y]]) => {
    const node = root.querySelector<MotionElement>(`.montage-${layer}`);
    node?.style.setProperty("--parallax-x", `${x}px`);
    node?.style.setProperty("--parallax-y", `${y}px`);
  });
  return true;
};
