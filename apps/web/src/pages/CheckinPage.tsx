import { MUSCLE_GROUPS, type MuscleGroup, type Muscles } from "@iron-coach/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError, OFFLINE_MESSAGE } from "../api";
import { useMe } from "../auth";
import { captureFrame, useCamera, type CameraError } from "../camera";
import { ConnectionError } from "../components/ConnectionError";
import { STATE_KEY, useCheckIn, useGameState, type CheckinCelebration } from "../gameState";

const CAMERA_MESSAGES: Readonly<Record<CameraError, { title: string; line: string }>> = {
  denied: {
    title: "Camera blocked",
    line: "You blocked the camera? Nice try. No selfie, no credit. Allow the camera in your browser settings and get your ass back here.",
  },
  missing: {
    title: "No camera",
    line: "No camera on this thing. That's a new one, I'll give you that. Grab a device with a front camera and try again.",
  },
  insecure: {
    title: "Camera unavailable",
    line: "Your browser only opens the camera on a secure https page, and this isn't one. Open the real site and stop wasting my damn time.",
  },
  failed: {
    title: "Camera trouble",
    line: "The camera won't start. Close whatever else is using it and try again. This doesn't count as a rest day.",
  },
};

const ALREADY_CHECKED_IN =
  "You already checked in today. One a day. Nice try, but you don't get double credit for showing off. Come back tomorrow.";

function CoachScreen({ title, line, onRetry }: {
  readonly title: string;
  readonly line: string;
  readonly onRetry?: () => void;
}): ReactElement {
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 p-6 sm:p-10">
      <h1 className="font-display text-7xl leading-[0.9] font-black text-iron-red uppercase sm:text-9xl">
        {title}
      </h1>
      <p className="max-w-[45ch] text-xl font-semibold">{line}</p>
      <div className="flex flex-wrap gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer bg-iron-red px-6 py-4 font-display text-3xl font-black text-mat uppercase transition-colors hover:bg-hazard"
          >
            Try again
          </button>
        )}
        <Link
          to="/"
          className="bg-plate px-6 py-4 font-display text-3xl font-black uppercase transition-colors hover:text-hazard"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}

export function CameraView({ stream, notice, camera = "front", onCapture }: {
  readonly stream: MediaStream | undefined;
  readonly notice: string | undefined;
  readonly camera?: "front" | "back";
  readonly onCapture: (video: HTMLVideoElement) => void;
}): ReactElement {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState<string>();

  const startVideo = useCallback(async (): Promise<void> => {
    try {
      await video.current?.play();
      setPlayError(undefined);
    } catch (err) {
      setPlayError(err instanceof Error ? err.name : "unknown error");
    }
  }, []);

  useEffect(() => {
    if (!video.current) return;
    video.current.srcObject = stream ?? null;
    // Autoplay alone can leave a black screen on phones that block it, so ask, and offer a tap if that fails too.
    if (stream) void startVideo();
  }, [stream, startVideo]);

  return (
    <main className="fixed inset-0 bg-mat">
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        aria-label={`Live view from your ${camera} camera`}
        onPlaying={() => setPlaying(true)}
        className={`size-full object-cover ${camera === "front" ? "-scale-x-100" : ""}`}
      />
      <Link to="/" className="absolute top-4 left-4 bg-plate px-4 py-2.5 font-display text-2xl font-black uppercase">
        Home
      </Link>
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-4">
        {notice && (
          <p role="alert" className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
            {notice}
          </p>
        )}
        {stream && !playing && (
          <button
            type="button"
            onClick={() => void startVideo()}
            className="cursor-pointer bg-plate px-6 py-3 font-display text-3xl font-black uppercase transition-colors hover:text-hazard"
          >
            Start camera
          </button>
        )}
        {playError && !playing && (
          <p role="alert" className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
            The camera video won't play: {playError}
          </p>
        )}
        <button
          type="button"
          aria-label="Take photo"
          disabled={!playing}
          onClick={() => {
            if (video.current) onCapture(video.current);
          }}
          className="size-24 cursor-pointer rounded-full border-8 border-chalk bg-iron-red transition-colors hover:bg-hazard disabled:cursor-wait disabled:opacity-50"
        />
      </div>
    </main>
  );
}

function ReviewView({ photoUrl, isDemo, busy, notice, onRetake, onSubmit }: {
  readonly photoUrl: string;
  readonly isDemo: boolean;
  readonly busy: boolean;
  readonly notice: string | undefined;
  readonly onRetake: () => void;
  readonly onSubmit: (muscles: readonly MuscleGroup[]) => void;
}): ReactElement {
  const [muscles, setMuscles] = useState<readonly MuscleGroup[]>([]);

  function toggle(group: MuscleGroup): void {
    setMuscles((current) =>
      current.includes(group) ? current.filter((muscle) => muscle !== group) : [...current, group],
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <img src={photoUrl} alt="Your selfie" className="max-h-[50dvh] w-full bg-plate object-contain" />
      {isDemo && <p className="font-semibold text-hazard">Demo mode: this photo won't be saved.</p>}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-display text-4xl leading-none font-black uppercase">
          What did you train?
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MUSCLE_GROUPS.map((group) => (
            <label
              key={group}
              className="cursor-pointer bg-plate px-3 py-4 text-center font-display text-3xl font-black uppercase transition-colors hover:text-hazard has-checked:bg-iron-red has-checked:text-mat has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-hazard"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={muscles.includes(group)}
                onChange={() => toggle(group)}
              />
              {group}
            </label>
          ))}
        </div>
      </fieldset>

      {notice && (
        <p role="alert" className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
          {notice}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onRetake}
          className="cursor-pointer bg-plate px-6 py-4 font-display text-3xl font-black uppercase transition-colors hover:text-hazard disabled:cursor-wait"
        >
          Retake
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmit(muscles)}
          className="flex-1 cursor-pointer bg-iron-red px-6 py-4 font-display text-3xl font-black text-mat uppercase transition-colors hover:bg-hazard disabled:cursor-wait"
        >
          {busy ? "Saving…" : "Submit"}
        </button>
      </div>
    </main>
  );
}

interface Photo {
  readonly blob: Blob;
  readonly url: string;
}

function CheckinFlow({ before, isDemo, onSaved }: {
  readonly before: Muscles;
  readonly isDemo: boolean;
  readonly onSaved: () => void;
}): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkIn = useCheckIn();
  const [photo, setPhoto] = useState<Photo>();
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<string>();
  const [saved, setSaved] = useState(false);
  const camera = useCamera(!photo, attempt);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  async function handleCapture(video: HTMLVideoElement): Promise<void> {
    try {
      const blob = await captureFrame(video);
      setNotice(undefined);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setNotice("That photo didn't work. Try again.");
    }
  }

  async function handleSubmit(muscles: readonly MuscleGroup[]): Promise<void> {
    if (!photo) return;
    if (!muscles.length) {
      setNotice("Pick at least one muscle. You did train something, right?");
      return;
    }
    setNotice(undefined);
    try {
      await checkIn.mutateAsync({ selfie: photo.blob, muscles });
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : OFFLINE_MESSAGE);
      return;
    }
    // Set first: the fresh state says "checked in today", which must not show the "already" screen here.
    setSaved(true);
    onSaved();
    await queryClient.invalidateQueries({ queryKey: STATE_KEY });
    const celebration: CheckinCelebration = { before, trained: muscles };
    await navigate("/", { replace: true, state: { celebration } });
  }

  if (photo) {
    return (
      <ReviewView
        photoUrl={photo.url}
        isDemo={isDemo}
        busy={checkIn.isPending || saved}
        notice={notice}
        onRetake={() => {
          setNotice(undefined);
          setPhoto(undefined);
        }}
        onSubmit={(muscles) => void handleSubmit(muscles)}
      />
    );
  }
  if (camera.error) {
    return (
      <CoachScreen
        {...CAMERA_MESSAGES[camera.error]}
        onRetry={() => setAttempt(attempt + 1)}
      />
    );
  }
  return (
    <CameraView
      stream={camera.stream}
      notice={notice}
      onCapture={(video) => void handleCapture(video)}
    />
  );
}

export function CheckinPage(): ReactElement | null {
  const { data: user } = useMe();
  const { data, isError, refetch } = useGameState();
  const [saved, setSaved] = useState(false);

  if (!data || !user) return isError ? <ConnectionError onRetry={() => void refetch()} /> : null;
  if (data.state.checkedInToday && !saved) {
    return <CoachScreen title="Already done" line={ALREADY_CHECKED_IN} />;
  }
  return <CheckinFlow before={data.state.muscles} isDemo={user.isDemo} onSaved={() => setSaved(true)} />;
}
