import { MIN_PASSWORD_LENGTH } from "@iron-coach/core";
import type { ReactElement } from "react";
import { useNavigate } from "react-router";
import { useMe, useRegister, type AuthValues } from "../auth";
import { AuthPoster, type AuthField } from "../components/AuthPoster";

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
  const { data: me } = useMe();

  async function handleSubmit(values: AuthValues): Promise<void> {
    // GuestRoute sends a just-registered user here, not to home.
    await navigate(".", { replace: true, state: { from: "/onboarding" } });
    await register.mutateAsync(values);
  }

  return (
    <AuthPoster
      headline={["Sign up.", "Show up."]}
      coachLine={
        me?.isDemo
          ? "Your demo check-ins and settings come with you. The sample check-ins don't."
          : "Coach Iron takes everyone. He just won't be nice about it."
      }
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
