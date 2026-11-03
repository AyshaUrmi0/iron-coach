import {
  useMutation,
  useQuery,
  useQueryClient,
  type Query,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { get, isLoggedOutError, patch, post, type User } from "./api";

export const ME_KEY = ["me"];

export type AuthValues = Readonly<Record<string, string>>;

interface UserResponse {
  readonly user: User;
}

/** Everything cached for the current user, apart from the user itself. */
function isUserData({ queryKey }: Query): boolean {
  return queryKey[0] !== ME_KEY[0];
}

async function fetchMe(): Promise<User | null> {
  try {
    return (await get<UserResponse>("/me")).user;
  } catch (err) {
    if (isLoggedOutError(err)) return null;
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
      // A demo visitor can log in to another account, so the old account's data must go.
      queryClient.removeQueries({ predicate: isUserData });
      queryClient.setQueryData(ME_KEY, user);
    },
  });
}

export function useUpdateMe(): UseMutationResult<UserResponse, Error, Partial<User>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<User>) => patch<UserResponse>("/me", updates),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(ME_KEY, user);
      // A new weekly goal changes the skip days and the roast.
      return queryClient.invalidateQueries({ predicate: isUserData });
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
      queryClient.removeQueries({ predicate: isUserData });
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}
