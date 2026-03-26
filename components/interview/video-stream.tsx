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
    if (!videoRef.current) return;
    // ✅ FIX: Always reassign srcObject, even if stream reference changes
    if (videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative h-full w-full bg-black">
      {/* ✅ Always render the <video> tag — hiding it avoids re-mount issues */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${!stream ? "hidden" : ""}`}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Waiting for {label}...
        </div>
      )}
    </div>
  );
}