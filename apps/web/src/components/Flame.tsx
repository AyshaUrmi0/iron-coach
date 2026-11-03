import type { ReactElement } from "react";

export function Flame({ className }: { readonly className: string }): ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`fill-hazard ${className}`}>
      <path d="M12 2c1 4-4 6-4 11a4 4 0 0 0 1 3c-2-1-3-3-3-5-2 2-3 4-3 6a9 9 0 0 0 18 0c0-6-5-9-9-15Z" />
    </svg>
  );
}
