import { MAX_MEAL_NAME_LENGTH, MAX_MEAL_PROTEIN } from "@iron-coach/core";
import { useId, useRef, useState, type FormEvent, type ReactElement } from "react";
import { ApiError, OFFLINE_MESSAGE, type User } from "../api";
import { useMe } from "../auth";
import { AppHeader } from "../components/AppHeader";
import { TodaysProtein } from "../components/TodaysProtein";
import { useDeleteMeal, useLogMeal, useSavedFoods, useTodaysMeals } from "../meals";

const WHOLE_NUMBER = /^\d+$/;
const FIELD_STYLE =
  "w-full border-b-4 border-steel bg-plate px-3.5 py-3 text-lg text-chalk transition-colors focus:border-hazard focus:outline-none";
const LABEL_STYLE = "mb-1 block font-semibold";
const HEADING_STYLE = "mb-3 font-display text-3xl font-black uppercase";

function problemWith(name: string, protein: string): string | undefined {
  if (!name) return "Enter what you ate.";
  if (!WHOLE_NUMBER.test(protein)) return "Enter the protein as a whole number of grams.";
  if (Number(protein) > MAX_MEAL_PROTEIN) return `That's over ${MAX_MEAL_PROTEIN} g in one meal. Check the number.`;
  return undefined;
}

function Meals({ user }: { readonly user: User }): ReactElement {
  const logMeal = useLogMeal();
  const deleteMeal = useDeleteMeal();
  const { data: foods } = useSavedFoods();
  const { meals } = useTodaysMeals(user);
  const nameId = useId();
  const proteinId = useId();
  const nameField = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [problem, setProblem] = useState<string>();
  const failed = logMeal.error ?? deleteMeal.error;

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const trimmedName = name.trim();
    const found = problemWith(trimmedName, protein.trim());
    setProblem(found);
    if (found) return;
    try {
      await logMeal.mutateAsync({ name: trimmedName, protein: Number(protein) });
    } catch {
      return; // Shown from logMeal.error below, and what was typed stays so it can be retried.
    }
    setName("");
    setProtein("");
    nameField.current?.focus();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <AppHeader />
      <h1 className="font-display text-6xl font-black text-iron-red uppercase sm:text-8xl">Meals</h1>

      <TodaysProtein user={user} />

      <form noValidate onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3">
        <h2 className={HEADING_STYLE}>Log a meal</h2>
        <div>
          <label htmlFor={nameId} className={LABEL_STYLE}>
            What did you eat?
          </label>
          <input
            ref={nameField}
            id={nameId}
            type="text"
            maxLength={MAX_MEAL_NAME_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD_STYLE}
          />
        </div>
        <div>
          <label htmlFor={proteinId} className={LABEL_STYLE}>
            Protein (grams)
          </label>
          <input
            id={proteinId}
            type="text"
            inputMode="numeric"
            value={protein}
            onChange={(event) => setProtein(event.target.value)}
            className={FIELD_STYLE}
          />
        </div>
        {problem && (
          <p role="alert" className="font-medium text-hazard">
            {problem}
          </p>
        )}
        <button
          type="submit"
          disabled={logMeal.isPending}
          className="cursor-pointer bg-iron-red px-6 py-4 font-display text-3xl font-black text-mat uppercase transition-colors hover:bg-hazard disabled:cursor-wait"
        >
          {logMeal.isPending ? "Logging…" : "Log it"}
        </button>
      </form>

      {failed && (
        <p role="alert" className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
          {failed instanceof ApiError ? failed.message : OFFLINE_MESSAGE}
        </p>
      )}

      {Boolean(foods?.length) && (
        <section>
          <h2 className={HEADING_STYLE}>Saved foods</h2>
          <p className="mb-3 text-steel">One tap logs it again.</p>
          <ul className="flex flex-wrap gap-2">
            {foods?.map((food) => (
              <li key={food.name}>
                <button
                  type="button"
                  disabled={logMeal.isPending}
                  onClick={() => logMeal.mutate(food)}
                  className="cursor-pointer border-2 border-chalk px-3 py-2 font-semibold transition-colors hover:border-hazard hover:text-hazard disabled:cursor-wait"
                >
                  {food.name}, {food.protein} g
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className={HEADING_STYLE}>Today</h2>
        {meals?.length === 0 && <p className="text-steel">Nothing logged yet today.</p>}
        <ul className="flex flex-col gap-2">
          {meals?.map((meal) => (
            <li key={meal.id} className="flex items-center justify-between gap-3 bg-plate px-4 py-1">
              <span className="min-w-0 break-words">
                {meal.name}, <span className="font-semibold">{meal.protein} g</span>
              </span>
              <button
                type="button"
                aria-label={`Delete ${meal.name}`}
                disabled={deleteMeal.isPending}
                onClick={() => deleteMeal.mutate(meal.id)}
                className="cursor-pointer py-2.5 font-semibold underline underline-offset-4 hover:text-hazard disabled:cursor-wait"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export function MealsPage(): ReactElement | null {
  const { data: user } = useMe();
  return user ? <Meals user={user} /> : null;
}
