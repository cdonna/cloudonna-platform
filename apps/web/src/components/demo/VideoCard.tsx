"use client";

/**
 * Renders a real player once video.videoUrl is set (native <video>,
 * click-to-play poster, captions track, no autoplay audio) — until
 * then, video.videoUrl is null and this shows a designed gradient
 * title card instead. That placeholder is deliberate content, not a
 * "coming soon" apology: no dead play button, no broken thumbnail. Both
 * branches share the same aspect-video container so the grid never
 * jumps once real assets land.
 */
import { useState } from "react";
import { Play } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import type { DemoVideo } from "./types";

const ACCENTS = [
  "from-nova-accent to-sunset-coral",
  "from-sunset-coral to-sunset-amber",
  "from-aurora-secondary to-nova-accent",
  "from-sunset-amber to-nova-accent-strong",
  "from-nova-accent-strong to-aurora-secondary",
];

export function VideoCard({ video, index }: { video: DemoVideo; index: number }) {
  const { dict } = useLocale();
  const [playing, setPlaying] = useState(false);
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <div className="overflow-hidden rounded-3xl border border-titanium bg-carbon shadow-sm">
      <div className="relative aspect-video overflow-hidden bg-carbon-2">
        {video.videoUrl ? (
          playing ? (
            <video className="h-full w-full" controls autoPlay poster={video.poster ?? undefined}>
              <source src={video.videoUrl} />
              {video.captionsUrl && <track kind="captions" src={video.captionsUrl} srcLang={video.language} default />}
              Your browser does not support embedded video.
            </video>
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`${dict.common.playVideo}: ${video.title}`}
              className={`group relative flex h-full w-full items-center justify-center bg-gradient-to-br ${accent} focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:ring-inset`}
              style={video.poster ? { backgroundImage: `url(${video.poster})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
              <span aria-hidden="true" className="absolute inset-0 bg-obsidian/25 transition duration-control group-hover:bg-obsidian/10" />
              <span
                aria-hidden="true"
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-obsidian/70 text-white backdrop-blur-sm transition duration-control group-hover:scale-105"
              >
                <Play size={22} fill="currentColor" />
              </span>
            </button>
          )
        ) : (
          <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${accent} px-6 text-center`}>
            <span className="text-lg font-semibold text-white">{video.title}</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-nova-ink">{video.title}</h3>
          {video.duration && <span className="shrink-0 text-xs font-medium text-nova-ink-faint">{video.duration}</span>}
        </div>
        <p className="mt-1.5 text-sm leading-6 text-nova-ink-faint">{video.description}</p>
      </div>
    </div>
  );
}
