import type { ReactElement } from "react";
import { NavLink } from "react-router";
import { useLogout, useMe } from "../auth";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/checkin", label: "Check in" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" },
] as const;

interface ComingSoonPageProps {
  readonly title: string;
  readonly step: number;
}

/** Stands in for a screen until its build step replaces it. */
export function ComingSoonPage({ title, step }: ComingSoonPageProps): ReactElement {
  const { data: user } = useMe();
  const logout = useLogout();
  const logoutLabel = user?.isDemo ? "Leave demo" : "Log out";

  return (
    <main className="@container flex min-h-dvh flex-col justify-between gap-10 p-6 sm:p-10">
      <nav aria-label="Main" className="flex flex-wrap gap-x-5 gap-y-2 text-steel">
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className="underline-offset-4 hover:text-chalk aria-[current=page]:text-chalk aria-[current=page]:underline"
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div>
        <h1 className="font-display text-[clamp(4rem,19cqw,14rem)] leading-[0.85] font-black text-iron-red uppercase">
          {title}
        </h1>
        <p className="mt-5 text-lg">
          {user?.name}, this screen arrives in step {step}.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
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
