import { afterEach, describe, expect, it, vi } from "vitest";

const PHOTO = Buffer.from("photo");
const OK = 200;
const TOO_MANY_REQUESTS = 429;
const BAD_GATEWAY = 502;
const LEG_PRESS = { isGymMachine: true, machine: "leg press", objects: ["leg press", "mirror"] };

function reply(content: string, status = OK): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }] }),
    { status, headers: { "content-type": "application/json" } },
  );
}

async function loadDetector(key: string) {
  vi.resetModules();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.stubEnv("MONGO_URL", "mongodb://localhost/test");
  vi.stubEnv("JWT_SECRET", "x".repeat(32));
  vi.stubEnv("GEMINI_API_KEY", key);
  return import("./machineDetector.js");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("detectMachine", () => {
  it("sends the photo to Gemini and returns what it found", async () => {
    const network = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
      Promise.resolve(reply(JSON.stringify(LEG_PRESS))),
    );
    vi.stubGlobal("fetch", network);
    const { detectMachine } = await loadDetector("key");

    await expect(detectMachine(PHOTO, "image/jpeg")).resolves.toEqual(LEG_PRESS);

    const [url, init] = network.mock.calls[0] ?? [];
    expect(String(url)).toContain("generativelanguage.googleapis.com");
    expect(String(init?.body)).toContain(`data:image/jpeg;base64,${PHOTO.toString("base64")}`);
    expect(String(init?.body)).toContain("gemini-3.1-flash-lite");
  });

  it.each([
    ["an error from Gemini", () => reply("{}", TOO_MANY_REQUESTS)],
    ["a reply that isn't JSON", () => reply("a leg press")],
    ["JSON of the wrong shape", () => reply(JSON.stringify({ isGymMachine: "yes" }))],
  ])("gives a safe error for %s", async (_name, answer) => {
    vi.stubGlobal("fetch", () => Promise.resolve(answer()));
    const { detectMachine } = await loadDetector("key");
    await expect(detectMachine(PHOTO, "image/jpeg")).rejects.toMatchObject({ status: BAD_GATEWAY });
  });

  it("calls nothing without a key", async () => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    const { detectMachine } = await loadDetector("");
    await expect(detectMachine(PHOTO, "image/jpeg")).rejects.toMatchObject({ status: BAD_GATEWAY });
    expect(network).not.toHaveBeenCalled();
  });
});
