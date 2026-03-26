"use client";

import { useEffect, useRef } from "react";

interface VideoStreamProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
}

export function VideoStream({ stream, muted = false, label }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black/50 text-muted-foreground text-sm">
        Waiting for {label}...
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="h-full w-full object-cover"
    />
  );
}