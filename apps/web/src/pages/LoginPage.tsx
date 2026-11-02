import type { ReactElement } from "react";
import { useLogin } from "../auth";
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
  return (
    <AuthPoster
      headline={["Back", "under", "the bar."]}
      coachLine="Coach Iron noticed you were gone. Get your lazy ass in here."
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
