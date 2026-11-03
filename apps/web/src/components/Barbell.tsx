import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, type ReactElement } from "react";

const WIDTH = 480;
const HEIGHT = 112;
const CENTER_Y = 56;
const COLLAR_X = 96;
const COLLAR_WIDTH = 8;
const COLLAR_HEIGHT = 22;
const PLATE_GAP = 3;
const PLATE_START_DISTANCE = 44;

const BEND_PER_PLATE = 3.5;
// How far along the bar's curve the plates sit: droop = bend * (1 - 2 * COLLAR_X / WIDTH)^2.
const DROOP_AT_PLATES = 0.36;
const TILT_DEGREES_PER_BEND = 0.7;
const LIFT_HEIGHT = -14;
const FAIL_SHAKE_SECONDS = 0.45;
const HALF = 0.5;

const SLAM_STIFFNESS = 620;
const SLAM_DAMPING = 24;
const SLAM_MASS = 0.9;
const SLAM = {
  type: "spring",
  stiffness: SLAM_STIFFNESS,
  damping: SLAM_DAMPING,
  mass: SLAM_MASS,
} as const;
const INSTANT = { duration: 0 } as const;

/* eslint-disable ts-patterns/no-magic-numbers -- these tables are where the sizes and shake steps are named */
const FAIL_SHAKE = [0, -11, 10, -7, 6, -3, 0];
const PLATES = [
  { color: "var(--color-iron-red)", width: 16, height: 92 },
  { color: "var(--color-hazard)", width: 13, height: 76 },
  { color: "var(--color-chalk)", width: 10, height: 58 },
] as const;
/* eslint-enable ts-patterns/no-magic-numbers */

interface BarbellProps {
  /** One entry per plate, inner plate first. True means the plate is on the bar. */
  readonly loaded: readonly boolean[];
  readonly lifting: boolean;
  /** Add one to play the failed-lift shake. */
  readonly failCount: number;
}

function barPath(bend: number): string {
  return `M 0 ${CENTER_Y + bend} Q ${WIDTH * HALF} ${CENTER_Y - bend} ${WIDTH} ${CENTER_Y + bend}`;
}

export function Barbell({ loaded, lifting, failCount }: BarbellProps): ReactElement {
  const reduceMotion = useReducedMotion();
  const shake = useAnimationControls();
  const transition = reduceMotion ? INSTANT : SLAM;

  const bend = loaded.filter(Boolean).length * BEND_PER_PLATE;
  const droop = bend * DROOP_AT_PLATES;
  const tilt = bend * TILT_DEGREES_PER_BEND;

  useEffect(() => {
    if (!failCount || reduceMotion) return;
    void shake.start({ x: FAIL_SHAKE, transition: { duration: FAIL_SHAKE_SECONDS } });
  }, [failCount, reduceMotion, shake]);

  // Each loaded plate sits against the one inside it, so gaps close when a field goes invalid.
  const { placed } = PLATES.reduce<{
    readonly used: number;
    readonly placed: readonly { readonly offset: number; readonly on: boolean }[];
  }>(
    ({ used, placed }, plate, index) => ({
      used: loaded[index] ? used + plate.width + PLATE_GAP : used,
      placed: [...placed, { offset: used, on: Boolean(loaded[index]) }],
    }),
    { used: 0, placed: [] },
  );

  return (
    <motion.svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full overflow-visible"
      aria-hidden="true"
      animate={{ y: lifting ? LIFT_HEIGHT : 0 }}
      transition={transition}
    >
      <motion.g animate={shake}>
        <motion.path
          fill="none"
          stroke="var(--color-steel)"
          strokeWidth={5}
          strokeLinecap="round"
          initial={false}
          animate={{ d: barPath(bend) }}
          transition={transition}
        />
        {[-1, 1].map((side) => (
          <motion.g
            key={side}
            initial={false}
            animate={{ y: droop, rotate: side * tilt }}
            transition={transition}
            style={{ transformOrigin: `${side < 0 ? COLLAR_X : WIDTH - COLLAR_X}px ${CENTER_Y}px` }}
          >
            <rect
              x={side < 0 ? COLLAR_X : WIDTH - COLLAR_X - COLLAR_WIDTH}
              y={CENTER_Y - COLLAR_HEIGHT * HALF}
              width={COLLAR_WIDTH}
              height={COLLAR_HEIGHT}
              fill="var(--color-steel)"
            />
            {PLATES.map((plate, index) => {
              const { offset, on } = placed[index];
              const distance = on ? offset : offset + PLATE_START_DISTANCE;
              const restingX =
                side < 0
                  ? COLLAR_X - plate.width - PLATE_GAP
                  : WIDTH - COLLAR_X + PLATE_GAP;
              return (
                <motion.rect
                  key={plate.color}
                  x={restingX}
                  y={CENTER_Y - plate.height * HALF}
                  width={plate.width}
                  height={plate.height}
                  rx={3}
                  fill={plate.color}
                  initial={false}
                  animate={{ x: side * distance, opacity: on ? 1 : 0 }}
                  transition={transition}
                />
              );
            })}
          </motion.g>
        ))}
      </motion.g>
    </motion.svg>
  );
}
