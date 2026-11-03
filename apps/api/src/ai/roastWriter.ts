import { pickRoast, type Language, type RoastLevel } from "@iron-coach/core";
import OpenAI from "openai";
import { env } from "../env.js";
import { COACH_SYSTEM_PROMPT, coachUserMessage } from "./coachPrompt.js";

const TIMEOUT_MS = 8000;
const MAX_TOKENS = 80;
const TEMPERATURE = 1;
const FINISHED_NORMALLY = "stop";
const SURROUNDING_QUOTES = /^["'“”]+|["'“”]+$/g;
const REFUSAL = /^(i can'?t|i cannot|i can’t|i won'?t|i won’t|i'?m sorry|i’m sorry|sorry,)/i;

export type RoastSource = "groq" | "openrouter" | "bank";

export interface RoastRequest {
  readonly name: string;
  readonly level: RoastLevel;
  readonly skipDays: number;
  /** The muscle the roast is about: the weakest one, or what was trained after a check-in. */
  readonly weakestMuscle: string;
  readonly streak: number;
  readonly language: Language;
}

export interface WrittenRoast {
  readonly text: string;
  readonly source: RoastSource;
}

interface Provider {
  readonly source: Exclude<RoastSource, "bank">;
  readonly baseURL: string;
  readonly apiKey: string | undefined;
  readonly model: string;
  /** Free models can spend the whole token limit on thinking and return nothing. */
  readonly extraBody?: Readonly<Record<string, unknown>>;
}

const PROVIDERS: readonly Provider[] = [
  {
    source: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: env.GROQ_API_KEY,
    // Groq shut Llama 70B down for free accounts. This one is a preview model; if it goes, OpenRouter takes over.
    model: "qwen/qwen3.8-27b",
  },
  {
    source: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
    model: "nvidia/nemotron-3.5-lightning:free",
    extraBody: { reasoning: { enabled: false } },
  },
];

// Off unless switched on: real AI replies included a violent threat in testing, and nothing filters them.
const AI_ENABLED = env.AI_ROASTS_ENABLED === "true";

type Messages = OpenAI.Chat.ChatCompletionMessageParam[];

/** The roast, or undefined when this provider failed, timed out, refused or got cut off. */
async function ask(provider: Provider, apiKey: string, messages: Messages): Promise<string | undefined> {
  const { source, baseURL, model, extraBody } = provider;
  // No retries: on a 429 or a timeout, the next provider is the retry.
  const client = new OpenAI({ baseURL, apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
  try {
    const { choices } = await client.chat.completions.create({
      model,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      ...extraBody,
    });
    const text = choices[0]?.message.content?.trim().replace(SURROUNDING_QUOTES, "").trim();
    if (text && choices[0]?.finish_reason === FINISHED_NORMALLY && !REFUSAL.test(text)) return text;
    console.warn(`[roast] ${source} gave no usable roast (${choices[0]?.finish_reason ?? "no choices"})`);
  } catch (err) {
    console.warn(`[roast] ${source} failed: ${err instanceof Error ? err.message : "unknown error"}`);
  }
  return undefined;
}

async function firstAnswer(
  providers: readonly Provider[],
  messages: Messages,
): Promise<WrittenRoast | undefined> {
  const [provider, ...rest] = providers;
  if (!provider) return undefined;
  // A missing key skips the provider, so the app works with no keys at all.
  const text = provider.apiKey ? await ask(provider, provider.apiKey, messages) : undefined;
  return text ? { text, source: provider.source } : firstAnswer(rest, messages);
}

export async function writeRoast(request: RoastRequest): Promise<WrittenRoast> {
  const { name, level, skipDays, weakestMuscle, streak, language } = request;
  const vars = { name, days: skipDays, muscle: weakestMuscle };
  const answer = await firstAnswer(AI_ENABLED ? PROVIDERS : [], [
    { role: "system", content: COACH_SYSTEM_PROMPT(language, level, vars) },
    {
      role: "user",
      content: coachUserMessage({ name, level, days: skipDays, muscle: weakestMuscle, streak, language }),
    },
  ]);

  if (answer) {
    console.log(`[roast] level=${level} language=${language} source=${answer.source}`);
    return answer;
  }

  console.log(`[roast] level=${level} language=${language} source=bank`);
  return {
    text: pickRoast(level, language, vars),
    source: "bank",
  };
}
