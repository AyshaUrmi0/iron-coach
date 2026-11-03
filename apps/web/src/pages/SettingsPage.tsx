import { MAX_NAME_LENGTH, MAX_PROTEIN_GOAL, MIN_PROTEIN_GOAL, START_BODIES, startBodyFrame } from "@iron-coach/core";
import { useId, useState, type FormEvent, type ReactElement } from "react";
import { ApiError, BODY_TYPES, OFFLINE_MESSAGE, WEEKLY_GOALS, type User } from "../api";
import { useLogout, useMe, useUpdateMe } from "../auth";
import { AppHeader } from "../components/AppHeader";
import { frameUrl } from "../components/Avatar";
import { ChoiceChips } from "../components/ChoiceChips";

const TITLE_STYLE = "mb-3 block font-display text-3xl font-black uppercase";
const INPUT_STYLE =
  "w-full border-b-4 border-steel bg-plate px-3.5 py-3 text-lg text-chalk transition-colors focus:border-hazard focus:outline-none aria-invalid:border-hazard";

function SectionTitle({ children }: { readonly children: string }): ReactElement {
  // Hidden from screen readers, which already hear the same words from the choices' legend.
  return (
    <p aria-hidden="true" className={TITLE_STYLE}>
      {children}
    </p>
  );
}

function Settings({ user }: { readonly user: User }): ReactElement {
  const update = useUpdateMe();
  const logout = useLogout();
  const nameId = useId();
  const nameErrorId = useId();
  const goalId = useId();
  const goalErrorId = useId();
  const [name, setName] = useState(user.name);
  const [bodyType, setBodyType] = useState(user.bodyType);
  const [startBody, setStartBody] = useState(user.startBody);
  const [weeklyGoal, setWeeklyGoal] = useState(user.weeklyGoal);
  const [proteinGoal, setProteinGoal] = useState(String(user.proteinGoal));
  const trimmedName = name.trim();
  const parsedGoal = Number(proteinGoal);
  const goalIsValid =
    Number.isInteger(parsedGoal) && parsedGoal >= MIN_PROTEIN_GOAL && parsedGoal <= MAX_PROTEIN_GOAL;
  const unchanged =
    trimmedName === user.name &&
    bodyType === user.bodyType &&
    startBody === user.startBody &&
    weeklyGoal === user.weeklyGoal &&
    parsedGoal === user.proteinGoal;
  const canSave = !unchanged && Boolean(trimmedName) && goalIsValid && !update.isPending;
  const logoutLabel = user.isDemo ? "Leave demo" : "Log out";

  function saveLabel(): string {
    if (update.isPending) return "Saving…";
    return unchanged && update.isSuccess ? "Saved" : "Save";
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (canSave) update.mutate({ name: trimmedName, bodyType, startBody, weeklyGoal, proteinGoal: parsedGoal });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 p-4 sm:p-6">
      <AppHeader />
      <h1 className="font-display text-6xl font-black text-iron-red uppercase sm:text-8xl">Settings</h1>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section>
          <label htmlFor={nameId} className={TITLE_STYLE}>
            Name
          </label>
          <p className="mb-3 text-steel">This is what Coach Iron yells at you.</p>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            maxLength={MAX_NAME_LENGTH}
            value={name}
            aria-invalid={!trimmedName}
            aria-describedby={trimmedName ? undefined : nameErrorId}
            onChange={(event) => setName(event.target.value)}
            className={INPUT_STYLE}
          />
          {!trimmedName && (
            <p id={nameErrorId} className="mt-2 font-medium text-hazard">
              Enter your name.
            </p>
          )}
        </section>

        <section>
          <SectionTitle>Body type</SectionTitle>
          <p className="mb-3 text-steel">Everyone gets the same avatar for now. Female art is coming later.</p>
          <ChoiceChips legend="Body type" options={BODY_TYPES} value={bodyType} onChange={setBodyType} />
        </section>

        <section>
          <SectionTitle>Starting shape</SectionTitle>
          <p className="mb-3 text-steel">
            Changing this recalculates your scores, body and title from your first check-in.
          </p>
          <ChoiceChips
            legend="Starting shape"
            options={START_BODIES}
            value={startBody}
            onChange={setStartBody}
            pictureFor={(option) => frameUrl(startBodyFrame(option))}
          />
        </section>

        <section>
          <SectionTitle>Days per week</SectionTitle>
          <p className="mb-3 text-steel">This changes your rest days, so it can change your skip days right away.</p>
          <ChoiceChips legend="Days per week" options={WEEKLY_GOALS} value={weeklyGoal} onChange={setWeeklyGoal} />
        </section>

        <section>
          <label htmlFor={goalId} className={TITLE_STYLE}>
            Daily protein goal (grams)
          </label>
          <input
            id={goalId}
            type="text"
            inputMode="numeric"
            value={proteinGoal}
            aria-invalid={!goalIsValid}
            aria-describedby={goalIsValid ? undefined : goalErrorId}
            onChange={(event) => setProteinGoal(event.target.value)}
            className={INPUT_STYLE}
          />
          {!goalIsValid && (
            <p id={goalErrorId} className="mt-2 font-medium text-hazard">
              Enter a whole number from {MIN_PROTEIN_GOAL} to {MAX_PROTEIN_GOAL}.
            </p>
          )}
        </section>

        {update.isError && (
          <p role="alert" className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
            {update.error instanceof ApiError ? update.error.message : OFFLINE_MESSAGE}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSave}
          className="cursor-pointer bg-iron-red px-6 py-4 font-display text-3xl font-black text-mat uppercase transition-colors hover:bg-hazard disabled:cursor-not-allowed disabled:bg-plate disabled:text-chalk"
        >
          {saveLabel()}
        </button>
      </form>

      <div className="flex flex-col items-start gap-3 border-t-2 border-plate pt-6">
        {logout.isError && (
          <p role="alert" className="font-medium text-hazard">
            Couldn't log you out. Check your connection and try again.
          </p>
        )}
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className="cursor-pointer bg-plate px-5 py-3 font-display text-2xl font-black uppercase transition-colors hover:bg-iron-red hover:text-mat disabled:cursor-wait"
        >
          {logout.isPending ? "Leaving…" : logoutLabel}
        </button>
      </div>
    </main>
  );
}

export function SettingsPage(): ReactElement | null {
  const { data: user } = useMe();
  return user ? <Settings user={user} /> : null;
}
