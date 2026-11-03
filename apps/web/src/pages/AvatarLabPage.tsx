import { avatarFrame, MUSCLE_GROUPS, type AvatarMood, type Muscles } from "@iron-coach/core";
import { useState, type ReactElement } from "react";
import { Avatar } from "../components/Avatar";
import { ChoiceChips } from "../components/ChoiceChips";

const MOODS: readonly AvatarMood[] = ["hype", "normal", "slump", "nuclear"];
const LOWEST_SCORE = 10;
const HIGHEST_SCORE = 100;
const START_SCORE = 20;

/** Dev only: try every body size and mood. The body follows the average, so one slider covers all six muscles. */
export function AvatarLabPage(): ReactElement {
  const [score, setScore] = useState(START_SCORE);
  const [mood, setMood] = useState<AvatarMood>("normal");
  const [flexKey, setFlexKey] = useState(0);
  const muscles = Object.fromEntries(MUSCLE_GROUPS.map((group) => [group, score])) as Muscles;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <h1 className="font-display text-4xl font-black uppercase">Avatar lab</h1>
      <div className="flex">
        <Avatar muscles={muscles} mood={mood} flexKey={flexKey} />
      </div>
      <label className="flex flex-col gap-2 font-semibold">
        Score {score}, frame {avatarFrame(score)}
        <input
          type="range"
          min={LOWEST_SCORE}
          max={HIGHEST_SCORE}
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
        />
      </label>
      <ChoiceChips legend="Mood" options={MOODS} value={mood} onChange={setMood} />
      <button
        type="button"
        onClick={() => setFlexKey(flexKey + 1)}
        className="bg-iron-red p-3 font-display text-2xl font-black text-mat uppercase transition-colors hover:bg-hazard"
      >
        Flex
      </button>
    </main>
  );
}
