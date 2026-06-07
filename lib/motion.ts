import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutRight,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  Easing,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/** Motion tokens aligned with animations.dev — ease-out for UI, subtle springs for delight. */
export const MOTION = {
  duration: {
    instant: 120,
    fast: 180,
    normal: 280,
    slow: 360,
  },
  /** Ease-out: starts fast, ends slow — default for user-facing UI. */
  easing: {
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  /** High damping = minimal bounce (frequency of use). */
  spring: {
    snappy: { damping: 24, stiffness: 320, mass: 0.85 } satisfies WithSpringConfig,
    gentle: { damping: 22, stiffness: 240, mass: 1 } satisfies WithSpringConfig,
    /** Slight overshoot for one-off success moments only. */
    pop: { damping: 16, stiffness: 260, mass: 0.9 } satisfies WithSpringConfig,
  },
  stagger: 50,
  pressScale: 0.97,
} as const;

export const SHEET_MOTION: WithTimingConfig = {
  duration: MOTION.duration.normal,
  easing: MOTION.easing.out,
};

function ms(reduced: boolean, normal: number, fast = MOTION.duration.fast) {
  return reduced ? fast : normal;
}

export function enterFade(reduced: boolean) {
  return FadeIn.duration(ms(reduced, MOTION.duration.normal));
}

export function exitFade(reduced: boolean) {
  return FadeOut.duration(ms(reduced, MOTION.duration.fast));
}

export function enterFadeUp(reduced: boolean, delay = 0) {
  if (reduced) return FadeIn.duration(MOTION.duration.fast);
  return FadeInUp.duration(MOTION.duration.normal)
    .delay(delay)
    .easing(MOTION.easing.out);
}

export function enterFadeDown(reduced: boolean, delay = 0) {
  if (reduced) return FadeIn.duration(MOTION.duration.fast);
  return FadeInDown.duration(MOTION.duration.normal)
    .delay(delay)
    .easing(MOTION.easing.out);
}

export function exitFadeDown(reduced: boolean) {
  if (reduced) return FadeOut.duration(MOTION.duration.fast);
  return FadeOutDown.duration(MOTION.duration.fast).easing(MOTION.easing.out);
}

export function enterStagger(reduced: boolean, index: number) {
  return enterFadeDown(reduced, reduced ? 0 : index * MOTION.stagger);
}

export type ScreenDirection = 'forward' | 'back';

/** Horizontal screen transition — forward slides in from right, back from left. */
export function enterScreen(reduced: boolean, direction: ScreenDirection) {
  if (reduced) return FadeIn.duration(MOTION.duration.fast);
  return direction === 'forward'
    ? FadeInRight.duration(MOTION.duration.normal).easing(MOTION.easing.out)
    : FadeInLeft.duration(MOTION.duration.normal).easing(MOTION.easing.out);
}

export function exitScreen(reduced: boolean, direction: ScreenDirection) {
  if (reduced) return FadeOut.duration(MOTION.duration.fast);
  return direction === 'forward'
    ? FadeOutLeft.duration(MOTION.duration.fast).easing(MOTION.easing.out)
    : FadeOutRight.duration(MOTION.duration.fast).easing(MOTION.easing.out);
}
