import type { MuscleGain } from "@iron-coach/core";
import { motion } from "motion/react";
import type { ReactElement } from "react";

const RISE_DISTANCE = 140;
const RISE_SECONDS = 1.6;
// Waits for the red page wipe to clear.
const START_DELAY_SECONDS = 0.5;
const STAGGER_SECONDS = 0.15;

/** The "+6 CHEST" numbers that fly up after a check-in. */
export function GainBurst({ gains }: { readonly gains: readonly MuscleGain[] }): ReactElement {
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-1/2 z-40 flex flex-col items-center"
    >
      {gains.map(({ muscle, gain }, index) => (
        <motion.p
          key={muscle}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -RISE_DISTANCE }}
          transition={{ duration: RISE_SECONDS, delay: START_DELAY_SECONDS + index * STAGGER_SECONDS }}
          className="font-display text-6xl font-black text-hazard uppercase [text-shadow:0_3px_0_#100e0d] sm:text-8xl"
        >
          +{gain} {muscle}
        </motion.p>
      ))}
    </div>
  );
}
