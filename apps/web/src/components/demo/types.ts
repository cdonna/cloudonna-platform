/**
 * Video-ready architecture: a real video can be dropped into any entry
 * below (poster + videoUrl + duration + captionsUrl) with no component
 * changes. Until then, videoUrl stays null and VideoCard renders an
 * elegant static placeholder instead of a broken player — see that
 * file's own comment. language supports adding localized demos later
 * without a redesign; every entry today is "en".
 */
export type DemoVideoCategory = "overview" | "walkthrough" | "result" | "memory" | "architects" | "data-economy";

export interface DemoVideo {
  id: string;
  title: string;
  description: string;
  /** Public path or URL to a poster frame. Ignored while videoUrl is null. */
  poster: string | null;
  /** Public path or URL to the video file itself. Null until a real asset exists. */
  videoUrl: string | null;
  /** Display duration, e.g. "1:45". Null until a real asset exists. */
  duration: string | null;
  /** BCP-47 language tag for this specific video asset. */
  language: string;
  /** Public path to a WebVTT captions file. */
  captionsUrl: string | null;
  category: DemoVideoCategory;
  /** Which role this video speaks to most directly. Optional — some
   * videos (product overview) are for everyone, not one persona. */
  persona: string | null;
}
