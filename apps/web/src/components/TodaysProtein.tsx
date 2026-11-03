import { hourInTimezone, proteinLevel, proteinRoast, proteinTotal } from "@iron-coach/core";
import type { ReactElement } from "react";
import { Link } from "react-router";
import type { User } from "../api";
import { useTodaysMeals } from "../meals";

const FULL_PERCENT = 100;

/** Today's protein against the goal, with the coach's line once there's something to say. */
export function TodaysProtein({ user, showLink = false }: {
  readonly user: User;
  readonly showLink?: boolean;
}): ReactElement | null {
  const { today, meals } = useTodaysMeals(user);
  if (!meals) return null;

  const { name, proteinGoal, language, timezone } = user;
  const total = proteinTotal(meals);
  const level = proteinLevel(total, proteinGoal, hourInTimezone(new Date(), timezone));
  const percent = Math.min((total / proteinGoal) * FULL_PERCENT, FULL_PERCENT);

  return (
    <section aria-label="Today's protein" className="flex flex-col gap-2 bg-plate p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="font-display text-3xl font-black uppercase tabular-nums">
          {total} / {proteinGoal} g protein
        </p>
        {showLink && (
          <Link to="/meals" className="py-2.5 font-semibold underline underline-offset-4 hover:text-hazard">
            Log a meal
          </Link>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Protein today"
        aria-valuemin={0}
        aria-valuemax={proteinGoal}
        aria-valuenow={Math.min(total, proteinGoal)}
        className="h-4 bg-mat"
      >
        <div
          style={{ width: `${percent}%` }}
          className={`h-full transition-[width] duration-500 ${level === "hit" ? "bg-hazard" : "bg-iron-red"}`}
        />
      </div>
      {level && (
        <p className="font-semibold">
          {proteinRoast(level, language, { name, left: proteinGoal - total }, today)}
        </p>
      )}
    </section>
  );
}
