import type { MuscleGroup, Muscles, State } from "@iron-coach/core";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { get, isConflictError, isLoggedOutError, postForm } from "./api";
import { ME_KEY } from "./auth";

export const STATE_KEY = ["state"];

export interface GameState {
  readonly state: State;
  readonly roast: string;
}

/** Passed to the home screen after a check-in, so it can show what just grew. */
export interface CheckinCelebration {
  readonly before: Muscles;
  readonly trained: readonly MuscleGroup[];
}

export interface PastCheckin {
  readonly id: string;
  readonly date: string;
  readonly muscles: readonly MuscleGroup[];
  readonly hasPhoto: boolean;
}

interface NewCheckin {
  readonly selfie: Blob;
  readonly muscles: readonly MuscleGroup[];
}

export function useGameState(): UseQueryResult<GameState> {
  return useQuery({
    queryKey: STATE_KEY,
    queryFn: () => get<GameState>("/state"),
  });
}

/** One "YYYY-MM" month of check-ins, for the history calendar. */
export function useCheckins(month: string): UseQueryResult<readonly PastCheckin[]> {
  return useQuery({
    queryKey: ["checkins", month],
    queryFn: async () => (await get<{ checkins: readonly PastCheckin[] }>(`/checkins?month=${month}`)).checkins,
  });
}

export function useCheckIn(): UseMutationResult<void, Error, NewCheckin> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ selfie, muscles }: NewCheckin) => {
      const form = new FormData();
      form.append("selfie", selfie, "selfie.jpg");
      muscles.forEach((muscle) => form.append("muscles", muscle));
      return postForm<void>("/checkins", form);
    },
    onError: (error) => {
      if (isLoggedOutError(error)) queryClient.setQueryData(ME_KEY, null);
      // Checked in from another tab or device, so the fresh state shows the "already done" screen.
      if (isConflictError(error)) return queryClient.invalidateQueries({ queryKey: STATE_KEY });
      return undefined;
    },
  });
}
