import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { ApiError, OFFLINE_MESSAGE, postForm } from "../api";
import { captureFrame, openBackCamera, useCamera } from "../camera";
import { CameraView } from "./CheckinPage";

interface MachineDetection {
  readonly isGymMachine: boolean;
  readonly machine: string | null;
  readonly objects: readonly string[];
}

function detect(photo: Blob): Promise<MachineDetection> {
  const form = new FormData();
  form.append("photo", photo, "machine.jpg");
  return postForm<MachineDetection>("/machines/detect", form);
}

const PHOTO_WARNING =
  "This photo goes to Google's Gemini free tier. Google can keep it and people there may review it, so keep people out of the shot.";

/** Point the back camera at something and see what Gemini says it is. The app saves nothing. */
export function MachineLabPage(): ReactElement {
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<string>();
  const [switches, setSwitches] = useState(0);
  const openCamera = useCallback(() => openBackCamera(switches), [switches]);
  const camera = useCamera(!photoUrl, attempt, openCamera);
  const detection = useMutation({ mutationFn: detect });

  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  async function handleCapture(video: HTMLVideoElement): Promise<void> {
    try {
      const blob = await captureFrame(video, false);
      setNotice(undefined);
      setPhotoUrl(URL.createObjectURL(blob));
      detection.mutate(blob);
    } catch {
      setNotice("That photo didn't work. Try again.");
    }
  }

  if (photoUrl) {
    const { data, error, isPending } = detection;
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 p-4 sm:p-6">
        <h1 className="font-display text-4xl font-black uppercase">Machine lab</h1>
        <img src={photoUrl} alt="What the back camera saw" className="max-h-[50dvh] w-full bg-plate object-contain" />
        <div role="status">
          {isPending && <p className="font-display text-3xl font-black uppercase">Checking…</p>}
          {error && (
            <p className="bg-hazard px-3.5 py-2.5 font-semibold text-mat">
              {error instanceof ApiError ? error.message : OFFLINE_MESSAGE}
            </p>
          )}
          {data && (
            <>
              <p className={`font-display text-5xl font-black uppercase ${data.isGymMachine ? "text-hazard" : "text-iron-red"}`}>
                {data.isGymMachine ? (data.machine ?? "Gym machine") : "No gym machine"}
              </p>
              <p className="mt-2 font-semibold">Saw: {data.objects.join(", ") || "nothing"}</p>
            </>
          )}
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            detection.reset();
            setPhotoUrl(undefined);
          }}
          className="cursor-pointer bg-iron-red px-6 py-4 font-display text-3xl font-black text-mat uppercase transition-colors hover:bg-hazard disabled:cursor-wait"
        >
          Scan again
        </button>
      </main>
    );
  }
  if (camera.error) {
    return (
      <main className="flex min-h-dvh flex-col justify-center gap-6 p-6">
        <h1 className="font-display text-5xl font-black text-iron-red uppercase">Back camera trouble: {camera.error}</h1>
        <p className="font-semibold">"missing" means no back camera, so open this on a phone. "insecure" means it needs https.</p>
        <button
          type="button"
          onClick={() => setAttempt(attempt + 1)}
          className="cursor-pointer bg-iron-red px-6 py-4 font-display text-3xl font-black text-mat uppercase transition-colors hover:bg-hazard"
        >
          Try again
        </button>
      </main>
    );
  }
  return (
    <>
      <CameraView
        stream={camera.stream}
        notice={notice ?? PHOTO_WARNING}
        camera="back"
        onCapture={(video) => void handleCapture(video)}
      />
      <div className="fixed top-4 right-4 flex max-w-[60%] flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setSwitches(switches + 1)}
          className="cursor-pointer bg-plate px-4 py-2.5 font-display text-2xl font-black uppercase transition-colors hover:text-hazard"
        >
          Switch camera
        </button>
        {/* The camera's own name, so a wrong camera can be reported. */}
        <p className="bg-mat/70 px-2 py-1 text-right text-sm">{camera.stream?.getVideoTracks()[0]?.label}</p>
      </div>
    </>
  );
}
