import type { State } from "@iron-coach/core";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { get } from "./api";

const FRESH_MS = 300_000;

export interface GameState {
  readonly state: State;
  readonly roast: string;
}

/**
 * Each fetch picks a new roast, so refetching on every tab switch would retype it and shake the
 * screen again. Staying fresh for a while avoids that, and a tab left open still catches a new day.
 */
export function useGameState(): UseQueryResult<GameState> {
  return useQuery({
    queryKey: ["state"],
    queryFn: () => get<GameState>("/state"),
    staleTime: FRESH_MS,
  });
}
