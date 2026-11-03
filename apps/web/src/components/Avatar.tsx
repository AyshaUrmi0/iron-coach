import { AVATAR_FRAMES, averageScore, avatarFrame, titleFor, type AvatarMood, type Muscles } from "@iron-coach/core";
import { useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactElement } from "react";

const MS_PER_FRAME = 60;

const MOOD_STYLES: Readonly<Record<AvatarMood, string>> = {
  hype: "",
  normal: "",
  slump: "translate-y-1 rotate-1 brightness-75 saturate-50",
  nuclear: "brightness-50 saturate-50 motion-safe:animate-shiver",
};

export function frameUrl(frame: number): string {
  return `/avatar/${frame}.webp`;
}

/**
 * Frames cut from the user's own video, heaviest to most muscular. The body steps through them
 * toward its score, so changes play out instead of jumping.
 * shortcut: one male body for everyone, add female frames when that art exists.
 */
export function Avatar({ muscles, mood, startFrom, flexKey = 0 }: {
  readonly muscles: Muscles;
  readonly mood: AvatarMood;
  /** The body grows from these scores instead of starting at its current size. */
  readonly startFrom?: Muscles;
  /** Each new value above 0 plays the flex. */
  readonly flexKey?: number;
}): ReactElement {
  const reduceMotion = useReducedMotion();
  const average = averageScore(muscles);
  const target = avatarFrame(average);
  const [frame, setFrame] = useState(() => avatarFrame(averageScore(startFrom ?? muscles)));

  // Loaded up front, so a growing body doesn't wait on the network between steps.
  useEffect(() => {
    for (let index = 0; index < AVATAR_FRAMES; index++) new Image().src = frameUrl(index);
  }, []);

  useEffect(() => {
    if (frame === target || reduceMotion) return;
    const timer = setTimeout(() => setFrame(frame + Math.sign(target - frame)), MS_PER_FRAME);
    return () => clearTimeout(timer);
  }, [frame, target, reduceMotion]);

  return (
    // Each animation has its own layer, so the flex, the shiver and the breathing can't cancel each other.
    <div className={`relative min-h-[28rem] flex-1 origin-bottom transition-[filter,translate,rotate] duration-700 lg:min-h-96 ${MOOD_STYLES[mood]}`}>
      <div key={flexKey} className={`absolute inset-0 origin-bottom ${flexKey ? "motion-safe:animate-flex" : ""}`}>
        <img
          src={frameUrl(reduceMotion ? target : frame)}
          alt={`Your avatar: ${titleFor(average)}`}
          className="size-full origin-bottom object-contain object-bottom motion-safe:animate-breathe"
        />
      </div>
    </div>
  );
}
