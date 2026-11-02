import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { ApiError, get, post, type User } from "./api";

const HTTP_UNAUTHORIZED = 401;
const ME_KEY = ["me"];

export type AuthValues = Readonly<Record<string, string>>;

interface UserResponse {
  readonly user: User;
}

async function fetchMe(): Promise<User | null> {
  try {
    return (await get<UserResponse>("/me")).user;
  } catch (err) {
    if (err instanceof ApiError && err.status === HTTP_UNAUTHORIZED) return null;
    throw err;
  }
}

/** `data` is the user, or null when logged out. `error` means the API couldn't be reached. */
export function useMe(): UseQueryResult<User | null> {
  return useQuery({ queryKey: ME_KEY, queryFn: fetchMe, retry: false });
}

function useAuthMutation(path: string): UseMutationResult<UserResponse, Error, AuthValues> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AuthValues) => post<UserResponse>(path, values),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogin(): UseMutationResult<UserResponse, Error, AuthValues> {
  return useAuthMutation("/auth/login");
}

export function useRegister(): UseMutationResult<UserResponse, Error, AuthValues> {
  return useAuthMutation("/auth/register");
}

export function useStartDemo(): UseMutationResult<UserResponse, Error, AuthValues> {
  return useAuthMutation("/auth/demo");
}

export function useLogout(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<void>("/auth/logout"),
    onSuccess: () => {
      // Drops everything cached for this user, so the next person can't see it.
      queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== ME_KEY[0] });
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}
