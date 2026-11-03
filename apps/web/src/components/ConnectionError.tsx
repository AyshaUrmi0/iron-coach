import type { ReactElement } from "react";
import { OFFLINE_MESSAGE } from "../api";

export function ConnectionError({ onRetry }: { readonly onRetry: () => void }): ReactElement {
  return (
    <main className="grid min-h-dvh place-content-center gap-5 p-6 text-center">
      <p role="alert" className="text-lg">
        {OFFLINE_MESSAGE}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mx-auto cursor-pointer bg-iron-red px-5 py-3 font-display text-2xl font-black text-mat uppercase"
      >
        Try again
      </button>
    </main>
  );
}
