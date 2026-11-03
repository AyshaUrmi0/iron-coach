import type { ReactElement } from "react";
import { Link, NavLink } from "react-router";

const LINK_STYLE = "py-2.5 underline-offset-4 hover:underline aria-[current=page]:underline";

export function AppHeader(): ReactElement {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link to="/" className="font-display text-3xl font-black uppercase">
        Iron Coach
      </Link>
      <nav aria-label="Main" className="flex items-center gap-4 font-semibold sm:gap-5">
        <NavLink to="/meals" className={LINK_STYLE}>
          Meals
        </NavLink>
        <NavLink to="/history" className={LINK_STYLE}>
          History
        </NavLink>
        <NavLink to="/settings" className={LINK_STYLE}>
          Settings
        </NavLink>
      </nav>
    </header>
  );
}
