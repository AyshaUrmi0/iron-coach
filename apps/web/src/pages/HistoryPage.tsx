import { addMonths, dateInTimezone, datesInMonth, proteinTotal, weekdayOf } from "@iron-coach/core";
import { useState, type ReactElement } from "react";
import type { User } from "../api";
import { useMe } from "../auth";
import { AppHeader } from "../components/AppHeader";
import { ConnectionError } from "../components/ConnectionError";
import { Flame } from "../components/Flame";
import { useCheckins, type PastCheckin } from "../gameState";
import { useMeals, type Meal } from "../meals";

const MONTH_LENGTH = "YYYY-MM".length;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABEL = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });
const DAY_LABEL = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const MONTH_BUTTON =
  "cursor-pointer bg-plate px-4 py-2 font-display text-2xl font-black uppercase transition-colors hover:text-hazard disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-chalk";

function asUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function DayDetails({ date, checkin, meals }: {
  readonly date: string;
  readonly checkin: PastCheckin | undefined;
  readonly meals: readonly Meal[];
}): ReactElement {
  const day = DAY_LABEL.format(asUtc(date));
  return (
    <section className="flex flex-col gap-3 bg-plate p-4">
      <h2 className="font-display text-3xl font-black uppercase">{day}</h2>
      {checkin && (
        <>
          <ul className="flex flex-wrap gap-2">
            {checkin.muscles.map((muscle) => (
              <li key={muscle} className="bg-iron-red px-3 py-1 font-display text-xl font-black text-mat uppercase">
                {muscle}
              </li>
            ))}
          </ul>
          {checkin.hasPhoto ? (
            <img
              key={checkin.id}
              src={`/api/selfies/${checkin.id}`}
              alt={`Your selfie from ${day}`}
              className="max-h-[60dvh] w-full bg-mat object-contain"
            />
          ) : (
            <p className="text-steel">No photo for this one. Demo check-ins don't keep them.</p>
          )}
        </>
      )}
      {meals.length > 0 && (
        <>
          <p className="font-display text-2xl font-black uppercase">{proteinTotal(meals)} g protein</p>
          <ul className="flex flex-col gap-1">
            {meals.map((meal) => (
              <li key={meal.id} className="break-words">
                {meal.name}, <span className="font-semibold">{meal.protein} g</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function History({ user }: { readonly user: User }): ReactElement {
  const today = dateInTimezone(new Date(), user.timezone);
  const thisMonth = today.slice(0, MONTH_LENGTH);
  const [month, setMonth] = useState(thisMonth);
  const [selectedDate, setSelectedDate] = useState<string>();
  const checkinsQuery = useCheckins(month);
  const mealsQuery = useMeals(month);
  const { data: checkins } = checkinsQuery;
  const { data: meals } = mealsQuery;

  if (checkinsQuery.isError || mealsQuery.isError) {
    return (
      <ConnectionError
        onRetry={() => {
          void checkinsQuery.refetch();
          void mealsQuery.refetch();
        }}
      />
    );
  }

  const dates = datesInMonth(month);
  const mealsOn = (date: string): readonly Meal[] => meals?.filter((meal) => meal.date === date) ?? [];
  const checkinOn = (date: string): PastCheckin | undefined => checkins?.find((item) => item.date === date);
  const selectedMeals = selectedDate ? mealsOn(selectedDate) : [];
  const selectedCheckin = selectedDate ? checkinOn(selectedDate) : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <AppHeader />
      <h1 className="font-display text-6xl font-black text-iron-red uppercase sm:text-8xl">History</h1>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth(addMonths(month, -1))}
          className={MONTH_BUTTON}
        >
          Prev
        </button>
        <p aria-live="polite" className="text-center font-display text-3xl font-black uppercase">
          {MONTH_LABEL.format(asUtc(dates[0]))}
        </p>
        <button
          type="button"
          aria-label="Next month"
          disabled={month === thisMonth}
          onClick={() => setMonth(addMonths(month, 1))}
          className={MONTH_BUTTON}
        >
          Next
        </button>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center font-semibold text-steel">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {dates.map((date, index) => {
          const checkin = checkinOn(date);
          const dayMeals = mealsOn(date);
          const protein = proteinTotal(dayMeals);
          const shared = `flex aspect-square w-full flex-col items-center justify-center font-semibold ${
            date === today ? "outline-2 -outline-offset-2 outline-chalk" : ""
          }`;
          return (
            <li key={date} style={index ? undefined : { gridColumnStart: weekdayOf(date) + 1 }}>
              {checkin || dayMeals.length > 0 ? (
                <button
                  type="button"
                  aria-label={[
                    DAY_LABEL.format(asUtc(date)),
                    ...(checkin ? ["checked in"] : []),
                    ...(dayMeals.length ? [`${protein} grams of protein`] : []),
                  ].join(", ")}
                  aria-pressed={date === selectedDate}
                  aria-current={date === today ? "date" : undefined}
                  onClick={() => setSelectedDate(date)}
                  className={`${shared} cursor-pointer bg-plate leading-tight transition-colors hover:bg-iron-red aria-pressed:bg-iron-red`}
                >
                  {index + 1}
                  {checkin && <Flame className="size-1/4" />}
                  {dayMeals.length > 0 && <span className="text-xs">{protein}g</span>}
                </button>
              ) : (
                <span aria-current={date === today ? "date" : undefined} className={`${shared} text-steel`}>
                  {index + 1}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div aria-live="polite">
        {selectedDate && (selectedCheckin || selectedMeals.length > 0) && (
          <DayDetails date={selectedDate} checkin={selectedCheckin} meals={selectedMeals} />
        )}
        {checkins?.length === 0 && meals?.length === 0 && (
          <p className="text-lg font-semibold">Not one damn check-in this month. Fix that, starting today.</p>
        )}
      </div>
    </main>
  );
}

export function HistoryPage(): ReactElement | null {
  const { data: user } = useMe();
  return user ? <History user={user} /> : null;
}
