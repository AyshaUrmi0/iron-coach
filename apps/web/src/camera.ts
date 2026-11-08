import { useEffect, useState } from "react";

const IDEAL_WIDTH = 1280;
const MAX_PHOTO_SIDE = 1280;
const JPEG_QUALITY = 0.85;
const VIDEO_SIZE = { width: { ideal: IDEAL_WIDTH } };
// Android Chrome names cameras like "camera2 0, facing back", iPhones like "Back Camera".
const BACK_LABEL = /back|rear|environment/i;

export type CameraError = "denied" | "missing" | "insecure" | "failed";

interface Camera {
  readonly stream: MediaStream | undefined;
  readonly error: CameraError | undefined;
}

function cameraError(err: unknown): CameraError {
  if (!(err instanceof DOMException)) return "failed";
  if (err.name === "NotAllowedError" || err.name === "SecurityError") return "denied";
  if (err.name === "NotFoundError" || err.name === "OverconstrainedError") return "missing";
  return "failed";
}

function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

function openFrontCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", ...VIDEO_SIZE }, audio: false });
}

/**
 * Some Android phones open the selfie camera even when asked for the back one, so the camera's
 * name is checked too. Each switch moves on to the next camera, for phones whose names don't help.
 */
export async function openBackCamera(switches = 0): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, ...VIDEO_SIZE },
    audio: false,
  });
  const current = stream.getVideoTracks()[0];
  // Camera names are only filled in once the camera is allowed, which the request above has done.
  const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
  const cameras = devices.filter((device) => device.kind === "videoinput");
  const backIndex = cameras.findIndex((camera) => BACK_LABEL.test(camera.label));
  if (switches === 0 && (backIndex < 0 || BACK_LABEL.test(current?.label ?? ""))) return stream;

  const pick = cameras[(Math.max(backIndex, 0) + switches) % cameras.length];
  if (!pick || pick.deviceId === current?.getSettings().deviceId) return stream;
  stopCamera(stream);
  return navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: pick.deviceId }, ...VIDEO_SIZE }, audio: false });
}

/** Runs a camera while enabled, and always switches it off afterwards. Change `attempt` to retry. */
export function useCamera(
  enabled: boolean,
  attempt: number,
  open: () => Promise<MediaStream> = openFrontCamera,
): Camera {
  const [stream, setStream] = useState<MediaStream>();
  const [error, setError] = useState<CameraError>();

  useEffect(() => {
    if (!enabled) return;
    // Browsers only offer the camera on https and localhost.
    if (!navigator.mediaDevices) {
      setError("insecure");
      return;
    }

    let closed = false;
    let opened: MediaStream | undefined;
    setError(undefined);
    open()
      .then((started) => {
        // The user may have left while the permission prompt was open.
        if (closed) {
          stopCamera(started);
          return;
        }
        opened = started;
        setStream(started);
      })
      .catch((err: unknown) => {
        if (!closed) setError(cameraError(err));
      });

    return () => {
      closed = true;
      if (opened) stopCamera(opened);
      setStream(undefined);
    };
  }, [enabled, attempt, open]);

  return { stream, error };
}

/** A mirrored photo is flipped like the live selfie view, so it looks the way the user saw it. Small enough for the 4 MB upload limit. */
export function captureFrame(video: HTMLVideoElement, mirrored = true): Promise<Blob> {
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Can't draw the photo."));
  if (mirrored) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Can't save the photo."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
