"use client";

import { useEffect, useRef, useState } from "react";

type AudioMessagePlayerProps = {
  url: string;
  provider?: string | null;
  voiceName?: string | null;
  transcript?: string | null;
  credits?: number | null;
};

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioMessagePlayer({
  url,
  provider,
  voiceName,
  transcript,
  credits,
}: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [url]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  }

  const metaLabel = [provider, voiceName].filter(Boolean).join(" · ");
  const creditsLabel = credits ? ` · ${credits} credits` : "";

  return (
    <div className="audio-msg">
      <button
        className={`audio-msg-play${playing ? " audio-msg-play-active" : ""}`}
        onClick={togglePlay}
        type="button"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1.5" y="1" width="3.5" height="10" rx="1" />
            <rect x="7" y="1" width="3.5" height="10" rx="1" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.5 1.5l8 4.5-8 4.5V1.5z" />
          </svg>
        )}
      </button>

      <div className="audio-msg-body">
        <div
          className="audio-msg-track"
          onClick={seek}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          tabIndex={0}
        >
          <div
            className="audio-msg-fill"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="audio-msg-thumb"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <div className="audio-msg-meta">
          <span className="audio-msg-time">
            {currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
          </span>
          {metaLabel ? (
            <span className="audio-msg-voice">{metaLabel}{creditsLabel}</span>
          ) : null}
        </div>
      </div>

      {transcript ? (
        <p className="audio-msg-transcript">{transcript}</p>
      ) : null}
    </div>
  );
}
