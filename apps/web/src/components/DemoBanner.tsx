import type { ReactElement } from "react";
import { Link } from "react-router";

export function DemoBanner(): ReactElement {
  return (
    <aside className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-hazard px-6 py-2.5 font-semibold text-mat sm:px-10">
      <p>You're exploring a demo. It's deleted after 7 days and photos aren't saved.</p>
      <p className="flex gap-4">
        <Link to="/register" className="underline underline-offset-4">
          Sign up to keep your data
        </Link>
        <Link to="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </p>
    </aside>
  );
}
