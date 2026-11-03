import { LANGUAGES, type Language } from "@iron-coach/core";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ApiError, OFFLINE_MESSAGE, type User } from "../api";
import { useMe, useUpdateMe } from "../auth";
import { ChoiceChips } from "../components/ChoiceChips";

const BODY_TYPES: readonly User["bodyType"][] = ["male", "female"];
// eslint-disable-next-line ts-patterns/no-magic-numbers -- the allowed weekly goals, from the rules in CLAUDE.md
const WEEKLY_GOALS: readonly number[] = [2, 3, 4, 5, 6, 7];
const LANGUAGE_LABELS: Readonly<Record<Language, string>> = { en: "English" };

const SLIDE_DISTANCE = 60;
const SLIDE_SECONDS = 0.2;

const STEP_BODY = 0;
const STEP_GOAL = 1;
const STEP_LANGUAGE = 2;
const STEP_COACH = 3;
const STEP_COUNT = 4;

function Onboarding({ user }: { readonly user: User }): ReactElement {
  const navigate = useNavigate();
  const update = useUpdateMe();
  const [step, setStep] = useState(STEP_BODY);
  const [bodyType, setBodyType] = useState(user.bodyType);
  const [weeklyGoal, setWeeklyGoal] = useState(user.weeklyGoal);
  const [language, setLanguage] = useState(user.language);
  const heading = useRef<HTMLHeadingElement>(null);

  // Tells keyboard and screen reader users that the page moved on to a new question.
  useEffect(() => heading.current?.focus(), [step]);

  async function handleNext(): Promise<void> {
    if (step === STEP_COACH) {
      await navigate("/");
      return;
    }
    if (step === STEP_LANGUAGE) {
      try {
        await update.mutateAsync({ bodyType, weeklyGoal, language });
      } catch {
        return;
      }
    }
    setStep(step + 1);
  }

  const steps: readonly { title: string; intro: string; content?: ReactNode; next: string }[] = [
    {
      title: "Pick your body",
      intro: "Your avatar will use this body type. You can change it later.",
      content: <ChoiceChips legend="Body type" options={BODY_TYPES} value={bodyType} onChange={setBodyType} />,
      next: "Next",
    },
    {
      title: "Weekly goal",
      intro: "How many days a week will you train? Pick a number you'll actually hit.",
      content: (
        <ChoiceChips legend="Days per week" options={WEEKLY_GOALS} value={weeklyGoal} onChange={setWeeklyGoal} />
      ),
      next: "Next",
    },
    {
      title: "Roast language",
      intro: "Which language should he yell in? Banglish and Bangla are coming later.",
      content: (
        <ChoiceChips
          legend="Roast language"
          options={LANGUAGES}
          value={language}
          onChange={setLanguage}
          labelFor={(option) => LANGUAGE_LABELS[option]}
        />
      ),
      next: update.isPending ? "Saving…" : "Next",
    },
    {
      title: "Meet Coach Iron",
      intro: `${user.name}. I've heard every excuse there is, and I don't buy a damn one of them. Skip the gym and I WILL know. Now get your lazy ass moving.`,
      next: "Let's go",
    },
  ];
  const current = steps[step] ?? steps[STEP_BODY]!;

  return (
    <main className="flex min-h-dvh flex-col gap-8 overflow-x-clip p-6 sm:p-10">
      <p className="font-display text-3xl font-black uppercase">Iron Coach</p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={step}
          initial={{ x: SLIDE_DISTANCE, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -SLIDE_DISTANCE, opacity: 0 }}
          transition={{ duration: SLIDE_SECONDS }}
          className="flex flex-1 flex-col justify-center gap-6"
        >
          <p className="font-semibold">
            Step {step + 1} of {STEP_COUNT}
          </p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="font-display text-7xl leading-[0.9] font-black text-iron-red uppercase outline-none sm:text-9xl"
          >
            {current.title}
          </h1>
          <p className="max-w-[45ch] text-xl font-semibold">{current.intro}</p>
          {current.content}
        </motion.section>
      </AnimatePresence>

      {update.isError && (
        <p role="alert" className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
          {update.error instanceof ApiError ? update.error.message : OFFLINE_MESSAGE}
        </p>
      )}

      <div className="flex gap-3">
        {step > STEP_BODY && step < STEP_COACH && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="cursor-pointer bg-plate px-6 py-4 font-display text-3xl font-black uppercase transition-colors hover:text-hazard"
          >
            Back
          </button>
        )}
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => void handleNext()}
          className="flex-1 cursor-pointer bg-iron-red px-6 py-4 font-display text-3xl font-black text-mat uppercase transition-colors hover:bg-hazard disabled:cursor-wait"
        >
          {current.next}
        </button>
      </div>
    </main>
  );
}

export function OnboardingPage(): ReactElement | null {
  const { data: user } = useMe();
  return user ? <Onboarding user={user} /> : null;
}
