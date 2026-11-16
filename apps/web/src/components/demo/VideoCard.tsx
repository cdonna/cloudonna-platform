"use client";

/**
 * Renders a real player once video.videoUrl is set (native <video>,
 * click-to-play poster, captions track, no autoplay audio) — until
 * then, video.videoUrl is null and this shows a designed title card
 * instead. That placeholder is deliberate content, not a "coming soon"
 * apology: no dead play button, no broken thumbnail. Both branches
 * share the same aspect-video container so the grid never jumps once
 * real assets land.
 *
 * The placeholder used to cycle five two-stop gradients drawn from the
 * retired Miami accent range. It is now a single dark title card with
 * the video's own name set as type and a hairline rule — a slate, which
 * is what an unrecorded video actually is, rather than five different
 * decorative colours standing in for content.
 */
import { useState } from "react";
import { Play } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import type { DemoVideo } from "./types";

export function VideoCard({ video }: { video: DemoVideo }) {
  const { dict } = useLocale();
  const [playing, setPlaying] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-paper-2">
      <div className="register-dark relative aspect-video overflow-hidden bg-paper-3">
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
              className="group relative flex h-full w-full items-center justify-center focus-visible:ring-3 focus-visible:ring-accent/50 focus-visible:ring-inset focus-visible:outline-none"
              style={video.poster ? { backgroundImage: `url(${video.poster})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
              <span aria-hidden="true" className="absolute inset-0 bg-paper-3/40 transition-colors duration-control group-hover:bg-paper-3/20" />
              <span
                aria-hidden="true"
                className="relative flex h-14 w-14 items-center justify-center rounded-full border border-rule-2 bg-paper/80 text-ink backdrop-blur-sm transition-transform duration-control ease-nova-settle group-hover:scale-105"
              >
                <Play size={20} fill="currentColor" />
              </span>
            </button>
          )
        ) : (
          <div className="flex h-full w-full flex-col justify-end p-6">
            <span aria-hidden="true" className="mb-4 block h-px w-10 bg-accent" />
            <span className="text-[1.0625rem] leading-snug font-medium tracking-[-0.02em] text-ink">{video.title}</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[0.9375rem] font-medium text-ink">{video.title}</h3>
          {video.duration && <span className="shrink-0 font-mono text-label font-medium text-ink-3 uppercase">{video.duration}</span>}
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-2">{video.description}</p>
      </div>
    </div>
  );
}
