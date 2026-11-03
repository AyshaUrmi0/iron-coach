import { motion } from "motion/react";
import { useId, useState, type FormEvent, type ReactElement } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError, OFFLINE_MESSAGE } from "../api";
import { useMe, useStartDemo, type AuthValues } from "../auth";
import { Barbell } from "./Barbell";

const SLAM_DELAY_PER_LINE = 0.07;
const SLAM_START_DELAY = 0.12;
const SLAM_STIFFNESS = 520;
const SLAM_DAMPING = 30;
const SLAM = { type: "spring", stiffness: SLAM_STIFFNESS, damping: SLAM_DAMPING } as const;
const BUTTON_PRESS_DEPTH = 3;

export interface AuthField {
  readonly name: string;
  readonly label: string;
  readonly type: "text" | "email" | "password";
  readonly autoComplete: string;
  /** Returns what the user must fix, or undefined when the value is fine. */
  readonly validate: (value: string) => string | undefined;
}

interface AuthPosterProps {
  readonly headline: readonly string[];
  readonly coachLine: string;
  readonly fields: readonly AuthField[];
  readonly submitLabel: string;
  readonly pendingLabel: string;
  readonly altPrompt: string;
  readonly altLabel: string;
  readonly altTo: string;
  readonly isPending: boolean;
  readonly onSubmit: (values: AuthValues) => Promise<unknown>;
}

export function AuthPoster({
  headline,
  coachLine,
  fields,
  submitLabel,
  pendingLabel,
  altPrompt,
  altLabel,
  altTo,
  isPending,
  onSubmit,
}: AuthPosterProps): ReactElement {
  const formId = useId();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const startDemo = useStartDemo();
  const [values, setValues] = useState<AuthValues>({});
  const [fieldErrors, setFieldErrors] = useState<Readonly<Record<string, string | undefined>>>({});
  const [formError, setFormError] = useState<string>();
  const [failCount, setFailCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const loaded = fields.map(({ name, validate }) => !validate(values[name] ?? ""));
  const ready = loaded.every(Boolean);

  function fail(fieldMessages: Readonly<Record<string, string | undefined>>, message?: string): void {
    setFieldErrors(fieldMessages);
    setFormError(message);
    setFailCount((count) => count + 1);
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (isPending) return;

    const messages = Object.fromEntries(
      fields.map(({ name, validate }) => [name, validate(values[name] ?? "")]),
    );
    if (!ready) {
      fail(messages);
      return;
    }

    setFieldErrors({});
    setFormError(undefined);
    // Back to a password field, so password managers offer to save it.
    setShowPassword(false);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        const fromServer = Object.fromEntries(
          fields.map(({ name }) => [name, err.fields[name]?.[0]]),
        );
        fail(fromServer, err.message);
      } else {
        fail({}, OFFLINE_MESSAGE);
      }
    }
  }

  async function handleStartDemo(): Promise<void> {
    setFormError(undefined);
    try {
      await startDemo.mutateAsync({});
      await navigate("/");
    } catch (err) {
      fail({}, err instanceof ApiError ? err.message : OFFLINE_MESSAGE);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section className="@container flex flex-col justify-between gap-6 bg-iron-red p-6 pb-14 text-mat [clip-path:polygon(0_0,100%_0,100%_calc(100%-2.5rem),0_100%)] sm:p-10 sm:pb-16 lg:p-12 lg:pr-28 lg:[clip-path:polygon(0_0,100%_0,calc(100%-6rem)_100%,0_100%)]">
        <h1
          aria-label={headline.join(" ")}
          className="font-display text-[min(27cqw,29dvh)] leading-[0.82] font-black whitespace-nowrap uppercase"
        >
          {headline.map((line, index) => (
            <span key={line} aria-hidden="true" className="block overflow-hidden pt-[0.04em]">
              <motion.span
                className="block"
                initial={{ y: "-105%" }}
                animate={{ y: 0 }}
                transition={{ ...SLAM, delay: SLAM_START_DELAY + index * SLAM_DELAY_PER_LINE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <p className="max-w-[28ch] text-lg leading-snug font-semibold sm:text-xl">{coachLine}</p>
      </section>

      <section className="flex flex-col justify-center gap-6 px-6 pt-4 pb-10 sm:px-10 lg:py-6 lg:pr-14 lg:pl-8">
        <p className="font-display text-3xl font-black uppercase">Iron Coach</p>

        <Barbell loaded={loaded} lifting={isPending} failCount={failCount} />

        <form
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-4"
        >
          {fields.map(({ name, label, type, autoComplete }) => {
            const id = `${formId}-${name}`;
            const errorId = `${id}-error`;
            const error = fieldErrors[name];
            return (
              <div key={name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor={id} className="font-semibold">
                    {label}
                  </label>
                  {type === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((shown) => !shown)}
                      className="cursor-pointer font-semibold text-steel underline underline-offset-4 hover:text-hazard"
                    >
                      {showPassword ? "Hide password" : "Show password"}
                    </button>
                  )}
                </div>
                <input
                  id={id}
                  name={name}
                  type={type === "password" && showPassword ? "text" : type}
                  autoComplete={autoComplete}
                  required
                  value={values[name] ?? ""}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, [name]: event.target.value }));
                    setFieldErrors((current) => ({ ...current, [name]: undefined }));
                  }}
                  className="w-full border-b-4 border-steel bg-plate px-3.5 py-3 text-lg text-chalk transition-colors focus:border-hazard focus:outline-none aria-invalid:border-hazard"
                />
                {error && (
                  <p id={errorId} className="font-medium text-hazard">
                    {error}
                  </p>
                )}
              </div>
            );
          })}

          {formError && (
            <p role="alert" className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
              {formError}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={isPending}
            whileTap={{ y: BUTTON_PRESS_DEPTH }}
            className={`mt-1 cursor-pointer px-5 py-3.5 font-display text-3xl font-black uppercase transition-colors disabled:cursor-wait ${
              ready ? "bg-iron-red text-mat" : "bg-plate text-chalk"
            }`}
          >
            {isPending ? pendingLabel : submitLabel}
          </motion.button>
        </form>

        <p className="text-steel">
          {altPrompt}{" "}
          <Link to={altTo} className="font-semibold text-chalk underline underline-offset-4 hover:text-hazard">
            {altLabel}
          </Link>
        </p>

        <div className="flex flex-col gap-2 border-t-2 border-plate pt-5">
          {me?.isDemo ? (
            <Link
              to="/"
              className="border-2 border-chalk px-5 py-2.5 text-center font-display text-2xl font-black uppercase transition-colors hover:border-hazard hover:text-hazard"
            >
              Back to my demo
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled={startDemo.isPending}
                onClick={() => void handleStartDemo()}
                className="cursor-pointer border-2 border-chalk px-5 py-2.5 font-display text-2xl font-black uppercase transition-colors hover:border-hazard hover:text-hazard disabled:cursor-wait"
              >
                {startDemo.isPending ? "Starting demo…" : "Try the demo"}
              </button>
              <p className="text-center text-steel">No account needed. Sign up later to keep your data.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
