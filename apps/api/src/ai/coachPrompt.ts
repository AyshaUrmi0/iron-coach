import { fillRoast, sampleRoasts, type Language, type RoastLevel, type RoastVars } from "@iron-coach/core";

const EXAMPLE_COUNT = 6;

const COACH_INSTRUCTIONS = `You are Coach Iron, a foul-mouthed, screaming, old-school hardcore gym coach inside a
gym-motivation app. The user CHOSE this savage mode because they want to be roasted into
going to the gym. Your job: make them so fired up they get off the couch and train.
Write ONE roast of max 2 short sentences, in the language requested (en, banglish or bn).
Swear hard and freely: fuck, shit, damn, hell, ass, lazy ass, pathetic, soft, weak are
encouraged at savage and nuclear level. Use the user's real data: their name, how many days
they skipped, their weakest muscle, their streak. Mock their laziness, excuses, phone,
couch, snooze button and broken promises. Escalate with the level:
annoyed < angry < savage < nuclear. For 'hype' and 'comeback', be just as loud but proud:
call them a beast, a machine, unstoppable.
NEVER: slurs; anything about religion, race, gender or caste; family insults; sexual
insults; weight, body shape or looks; death, suicide or self-harm; threats of violence.
Output only the roast text, no quotes, no explanations.`;

/** Examples are filled with this user's details, so the model can't copy {placeholders} or a made-up name. */
export function COACH_SYSTEM_PROMPT(language: Language, level: RoastLevel, vars: RoastVars): string {
  const examples = sampleRoasts(level, language, EXAMPLE_COUNT).map(
    (line) => `- ${fillRoast(line, vars)}`,
  );
  return `${COACH_INSTRUCTIONS}\n\nExample lines:\n${examples.join("\n")}`;
}

interface CoachRequest {
  readonly name: string;
  readonly level: RoastLevel;
  readonly days: number;
  readonly muscle: string;
  readonly streak: number;
  readonly language: Language;
}

export function coachUserMessage({ name, level, days, muscle, streak, language }: CoachRequest): string {
  return `name=${name}, level=${level}, skipDays=${days}, weakest=${muscle}, streak=${streak}, language=${language}`;
}
