import type { ReactElement } from "react";
import { useLogin, useMe } from "../auth";
import { AuthPoster, type AuthField } from "../components/AuthPoster";

const FIELDS: readonly AuthField[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    validate: (value) => (value.includes("@") ? undefined : "Enter your email address."),
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "current-password",
    validate: (value) => (value ? undefined : "Enter your password."),
  },
];

export function LoginPage(): ReactElement {
  const login = useLogin();
  const { data: me } = useMe();
  return (
    <AuthPoster
      headline={["Back", "under", "the bar."]}
      coachLine={
        me?.isDemo
          ? "Logging in leaves this demo behind. To keep it, sign up instead."
          : "Coach Iron noticed you were gone. Get your lazy ass in here."
      }
      fields={FIELDS}
      submitLabel="Log in"
      pendingLabel="Logging in…"
      altPrompt="New here?"
      altLabel="Create an account"
      altTo="/register"
      isPending={login.isPending}
      onSubmit={login.mutateAsync}
    />
  );
}
