import { afterEach, describe, expect, it, vi } from "vitest";

const REQUEST = {
  name: "Rafi",
  level: "savage",
  skipDays: 4,
  weakestMuscle: "CHEST",
  streak: 0,
  language: "en",
} as const;
const GROQ = "api.groq.com";
const OPENROUTER = "openrouter.ai";
const TOO_MANY_REQUESTS = 429;
const OK = 200;
const TIMEOUT_MS = 8000;

function reply(content: string, finishReason = "stop", status = OK): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { role: "assistant", content }, finish_reason: finishReason }] }),
    { status, headers: { "content-type": "application/json" } },
  );
}

/** Answers each host from `answers`, and records every call. */
function mockNetwork(answers: Readonly<Record<string, () => Response | Promise<Response>>>): string[] {
  const hosts: string[] = [];
  vi.stubGlobal("fetch", (url: string | URL | Request) => {
    const { host } = new URL(url instanceof Request ? url.url : url);
    hosts.push(host);
    const answer = answers[host];
    if (!answer) throw new Error(`unexpected call to ${host}`);
    return Promise.resolve().then(answer);
  });
  return hosts;
}

async function loadWriter(keys: { groq?: string; openRouter?: string; aiOff?: boolean }) {
  vi.resetModules();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.stubEnv("MONGO_URL", "mongodb://localhost/test");
  vi.stubEnv("JWT_SECRET", "x".repeat(32));
  vi.stubEnv("GROQ_API_KEY", keys.groq ?? "");
  vi.stubEnv("OPENROUTER_API_KEY", keys.openRouter ?? "");
  vi.stubEnv("AI_ROASTS_ENABLED", keys.aiOff ? "" : "true");
  return import("./roastWriter.js");
}

const BOTH_KEYS = { groq: "g-key", openRouter: "o-key" };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("writeRoast", () => {
  it("uses the bank and calls nothing while AI is switched off, even with keys", async () => {
    const hosts = mockNetwork({});
    const { writeRoast } = await loadWriter({ ...BOTH_KEYS, aiOff: true });
    const { source } = await writeRoast(REQUEST);
    expect(source).toBe("bank");
    expect(hosts).toEqual([]);
  });

  it("uses the bank and calls nothing with no keys", async () => {
    const hosts = mockNetwork({});
    const { writeRoast } = await loadWriter({});
    const { source } = await writeRoast(REQUEST);
    expect(source).toBe("bank");
    expect(hosts).toEqual([]);
  });

  it("uses Groq first, with the coach prompt and the agreed settings", async () => {
    const bodies: unknown[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      expect(new URL(url).host).toBe(GROQ);
      bodies.push(JSON.parse(String(init.body)));
      return reply("Get your lazy ass up.");
    });
    const { writeRoast } = await loadWriter(BOTH_KEYS);

    expect(await writeRoast(REQUEST)).toEqual({ text: "Get your lazy ass up.", source: "groq" });
    expect(bodies[0]).toMatchObject({
      model: "qwen/qwen3.8-27b",
      max_tokens: 80,
      temperature: 1,
      messages: [
        { role: "system", content: expect.stringContaining("You are Coach Iron") },
        { role: "user", content: "name=Rafi, level=savage, skipDays=4, weakest=CHEST, streak=0, language=en" },
      ],
    });
  });

  it("falls back to OpenRouter on a 429, without retrying Groq", async () => {
    const hosts = mockNetwork({
      [GROQ]: () => reply("", "stop", TOO_MANY_REQUESTS),
      [OPENROUTER]: () => reply("Move, soft ass."),
    });
    const { writeRoast } = await loadWriter(BOTH_KEYS);
    expect(await writeRoast(REQUEST)).toEqual({ text: "Move, soft ass.", source: "openrouter" });
    expect(hosts).toEqual([GROQ, OPENROUTER]);
  });

  it("falls back to OpenRouter when Groq takes over 8 seconds", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
      if (new URL(url).host === OPENROUTER) return Promise.resolve(reply("Too slow, get up."));
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("timed out", "AbortError")));
      });
    });
    const { writeRoast } = await loadWriter(BOTH_KEYS);
    const pending = writeRoast(REQUEST);
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(await pending).toEqual({ text: "Too slow, get up.", source: "openrouter" });
  });

  it("skips Groq when only the OpenRouter key is set", async () => {
    const hosts = mockNetwork({ [OPENROUTER]: () => reply("Get up.") });
    const { writeRoast } = await loadWriter({ openRouter: "o-key" });
    expect((await writeRoast(REQUEST)).source).toBe("openrouter");
    expect(hosts).toEqual([OPENROUTER]);
  });

  it("uses the bank when both providers fail", async () => {
    mockNetwork({
      [GROQ]: () => reply("", "stop", TOO_MANY_REQUESTS),
      [OPENROUTER]: () => {
        throw new Error("network down");
      },
    });
    const { writeRoast } = await loadWriter(BOTH_KEYS);
    expect((await writeRoast(REQUEST)).source).toBe("bank");
  });

  it.each([
    ["a refusal", () => reply("I can't write that kind of insult.")],
    ["an empty reply", () => reply("  ")],
    ["a reply cut off at the token limit", () => reply("Get your lazy", "length")],
  ])("moves on to OpenRouter after %s", async (_kind, answer) => {
    mockNetwork({ [GROQ]: answer, [OPENROUTER]: () => reply("Get up.") });
    const { writeRoast } = await loadWriter(BOTH_KEYS);
    expect((await writeRoast(REQUEST)).source).toBe("openrouter");
  });

  it("strips quotes around the roast", async () => {
    mockNetwork({ [GROQ]: () => reply('"Get up, coward."') });
    const { writeRoast } = await loadWriter(BOTH_KEYS);
    expect((await writeRoast(REQUEST)).text).toBe("Get up, coward.");
  });

  it("puts 6 finished example lines with the user's own name in the system prompt", async () => {
    const { COACH_SYSTEM_PROMPT } = await import("./coachPrompt.js");
    const prompt = COACH_SYSTEM_PROMPT("en", "nuclear", { name: "Tanvir", days: 6, muscle: "LEGS" });
    expect(prompt.split("\n").filter((line) => line.startsWith("- "))).toHaveLength(6);
    expect(prompt).not.toContain("{");
    expect(prompt).toContain("Tanvir");
    expect(prompt).not.toContain("Rafi");
    expect(prompt).toContain("Output only the roast text, no quotes, no explanations.");
  });
});
