import type { AvatarMood } from "@iron-coach/core";
import type { ReactElement } from "react";

/** shortcut: holds the avatar's place while Step 7 is on hold, swap in the real avatar when it's ready. */
export function AvatarSlot({ mood }: { readonly mood: AvatarMood }): ReactElement {
  return (
    <div className="grid min-h-64 flex-1 place-content-center gap-1 border-4 border-dashed border-steel p-6 text-center lg:min-h-96">
      <p className="font-display text-3xl font-black text-chalk uppercase">Avatar coming soon</p>
      <p className="font-semibold text-chalk">Mood: {mood}</p>
    </div>
  );
}
