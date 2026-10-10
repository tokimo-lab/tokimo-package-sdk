/** 一首可播放的曲目（provider-agnostic）。 */
export interface MediaTrack {
  /** provider 域内唯一 id（apple-music 用 catalogId，local-music 用 song uuid）。 */
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
  /** 单位毫秒。可选——某些 provider 在 resolveAudioUrl 之后才知道。 */
  durationMs?: number;
  /** Provider 不透明扩展（apple-music 存 isrc、release year 等）。 */
  meta?: Record<string, unknown>;
}

export type RepeatMode = "off" | "one" | "all";

/** 当前 active media center 状态。null = 无任何播放。 */
export interface MediaCenterSnapshot {
  providerId: string;
  /** 当前活跃 queue 完整副本。 */
  queue: MediaTrack[];
  currentIndex: number;
  isPlaying: boolean;
  /** Resolving or loading the current audio source. */
  isLoading?: boolean;
  currentTimeMs: number;
  durationMs: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  /** 0..1。 */
  volume: number;
}

/**
 * 可选命令回调 — provider 可实现这些以接管对应的用户操作（如 video-player
 * 接管 pause/seek，因其状态不由 MediaCenter audio 元素驱动）。若 provider
 * 未提供某命令，host 使用默认实现（audio 引擎路径）。
 */
export interface MediaProviderCommands {
  /** 播放/恢复播放。若 provider 不实现，host 对有 resolveAudioUrl 的 provider 调 audio.play()。 */
  play?(): void | Promise<void>;
  /** 暂停。 */
  pause?(): void | Promise<void>;
  /** 跳转到指定时间（毫秒）。 */
  seek?(timeMs: number): void | Promise<void>;
  /** 下一首/项。 */
  next?(): void | Promise<void>;
  /** 上一首/项。 */
  previous?(): void | Promise<void>;
  /** 设置音量 0..1。 */
  setVolume?(v: number): void | Promise<void>;
}

/** Provider 注册时提供给 host 的 callback 集合。 */
export interface MediaProviderHandle {
  /** host UI 显示用（"Apple Music" / "本地音乐"）。 */
  displayName: string;
  /** Resolve a direct URL or an owned audio source. The host disposes owned sources. */
  resolveAudioUrl?(
    track: MediaTrack,
  ): string | MediaAudioSource | Promise<string | MediaAudioSource>;
  /**
   * 可选命令路由。若提供，host 将 pause/seek/next/previous/setVolume 等操作
   * 派发给 provider；否则使用默认 audio 引擎实现。
   */
  commands?: MediaProviderCommands;
  /** 可选：track 切换通知，便于 scrobble / 推荐刷新。 */
  onTrackChanged?(
    track: MediaTrack,
    reason: "user" | "auto-next" | "auto-repeat",
  ): void;
  /** 可选：queue 即将耗尽，让 provider 续接（返回 null = 不续）。 */
  fetchMore?(): Promise<MediaTrack[] | null>;
  /** 可选：provider 自定义资源清理（unregister 时触发）。 */
  dispose?(): void;
}

export interface PlayInput {
  providerId: string;
  queue: MediaTrack[];
  /** 默认 0。 */
  startIndex?: number;
  /** 起播时间（毫秒）。默认 0。 */
  startTimeMs?: number;
}

/** A playable source and its optional provider-owned session cleanup. */
export interface MediaAudioSource {
  url: string;
  kind: "direct" | "hls";
  dispose?(): void | Promise<void>;
}
