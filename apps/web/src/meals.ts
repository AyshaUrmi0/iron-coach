import { dateInTimezone } from "@iron-coach/core";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { del, get, isLoggedOutError, post, type User } from "./api";
import { ME_KEY } from "./auth";

const MONTH_LENGTH = "YYYY-MM".length;
const MEALS_KEY = "meals";
const FOODS_KEY = "foods";

export interface Meal {
  readonly id: string;
  readonly date: string;
  readonly name: string;
  readonly protein: number;
}

export interface SavedFood {
  readonly name: string;
  readonly protein: number;
}

/** One "YYYY-MM" month of meals. */
export function useMeals(month: string): UseQueryResult<readonly Meal[]> {
  return useQuery({
    queryKey: [MEALS_KEY, month],
    queryFn: async () => (await get<{ meals: readonly Meal[] }>(`/meals?month=${month}`)).meals,
  });
}

export function useSavedFoods(): UseQueryResult<readonly SavedFood[]> {
  return useQuery({
    queryKey: [FOODS_KEY],
    queryFn: async () => (await get<{ foods: readonly SavedFood[] }>("/meals/foods")).foods,
  });
}

/** Today's date for this user and what they've eaten so far. `meals` is undefined until loaded. */
export function useTodaysMeals(user: User): { readonly today: string; readonly meals: readonly Meal[] | undefined } {
  const today = dateInTimezone(new Date(), user.timezone);
  const { data } = useMeals(today.slice(0, MONTH_LENGTH));
  return { today, meals: data?.filter(({ date }) => date === today) };
}

function afterChange(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [MEALS_KEY] }),
    queryClient.invalidateQueries({ queryKey: [FOODS_KEY] }),
  ]);
}

function logOutIfExpired(queryClient: QueryClient, error: unknown): void {
  if (isLoggedOutError(error)) queryClient.setQueryData(ME_KEY, null);
}

export function useLogMeal(): UseMutationResult<unknown, Error, SavedFood> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (food: SavedFood) => post("/meals", food),
    onSuccess: () => afterChange(queryClient),
    onError: (error) => logOutIfExpired(queryClient, error),
  });
}

export function useDeleteMeal(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/meals/${id}`),
    onSuccess: () => afterChange(queryClient),
    onError: (error) => logOutIfExpired(queryClient, error),
  });
}
