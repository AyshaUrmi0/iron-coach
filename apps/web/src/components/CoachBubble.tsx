import { useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactElement } from "react";

const MS_PER_LETTER = 28;

/** Types the line out once. Give it a key of the line so a new line starts from the beginning. */
export function CoachBubble({ line }: { readonly line: string }): ReactElement {
  const reduceMotion = useReducedMotion();
  const [letters, setLetters] = useState(0);

  useEffect(() => {
    if (letters >= line.length) return;
    const timer = setTimeout(() => setLetters(letters + 1), MS_PER_LETTER);
    return () => clearTimeout(timer);
  }, [letters, line]);

  return (
    <section aria-label="Coach Iron says" className="bg-chalk p-4 text-mat sm:p-6">
      <p className="font-display text-xl font-black text-iron-red uppercase">Coach Iron</p>
      {/* The hidden full line keeps the bubble's height steady and gives screen readers all of it at once. */}
      <div className="grid text-xl leading-snug font-bold sm:text-2xl">
        <p className="col-start-1 row-start-1 opacity-0">{line}</p>
        <p aria-hidden="true" className="col-start-1 row-start-1">
          {reduceMotion ? line : line.slice(0, letters)}
        </p>
      </div>
    </section>
  );
}
