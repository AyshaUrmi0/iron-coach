import type { ReactElement } from "react";
import { useNavigate } from "react-router";
import type { AuthValues } from "../auth";
import { useRegister } from "../auth";
import { AuthPoster, type AuthField } from "../components/AuthPoster";

const MIN_PASSWORD_LENGTH = 8;

const FIELDS: readonly AuthField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    autoComplete: "name",
    validate: (value) => (value.trim() ? undefined : "Enter your name."),
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    validate: (value) => (value.includes("@") ? undefined : "Enter a valid email address."),
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    validate: (value) =>
      value.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : undefined,
  },
];

export function RegisterPage(): ReactElement {
  const register = useRegister();
  const navigate = useNavigate();

  async function handleSubmit(values: AuthValues): Promise<void> {
    // GuestRoute sends a just-registered user here, not to home.
    await navigate(".", { replace: true, state: { from: "/onboarding" } });
    await register.mutateAsync(values);
  }

  return (
    <AuthPoster
      headline={["Sign up.", "Show up."]}
      coachLine="Coach Iron takes everyone. He just won't be nice about it."
      fields={FIELDS}
      submitLabel="Create account"
      pendingLabel="Creating account…"
      altPrompt="Already have an account?"
      altLabel="Log in"
      altTo="/login"
      isPending={register.isPending}
      onSubmit={handleSubmit}
    />
  );
}
