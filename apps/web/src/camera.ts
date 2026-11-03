import { useEffect, useState } from "react";

const IDEAL_WIDTH = 1280;
const MAX_PHOTO_SIDE = 1280;
const JPEG_QUALITY = 0.85;

const FRONT_CAMERA: MediaStreamConstraints = {
  video: { facingMode: "user", width: { ideal: IDEAL_WIDTH } },
  audio: false,
};

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

/** Runs the front camera while enabled, and always switches it off afterwards. Change `attempt` to retry. */
export function useCamera(enabled: boolean, attempt: number): Camera {
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
    navigator.mediaDevices
      .getUserMedia(FRONT_CAMERA)
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
  }, [enabled, attempt]);

  return { stream, error };
}

/** The photo is flipped like the live view, so it looks the way the user saw it. Small enough for the 4 MB upload limit. */
export function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Can't draw the photo."));
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Can't save the photo."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
