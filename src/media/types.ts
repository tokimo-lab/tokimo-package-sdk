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
  currentTimeMs: number;
  durationMs: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  /** 0..1。 */
  volume: number;
}

/** Provider 注册时提供给 host 的 callback 集合。 */
export interface MediaProviderHandle {
  /** host UI 显示用（"Apple Music" / "本地音乐"）。 */
  displayName: string;
  /**
   * 解析 track 的可播 URL。必须是一个固定不变、HTMLAudio 能直接 src 的 URL
   * （http/https 同源或 CORS OK）。鉴权由 provider 后端处理，host 完全无感知。
   * 同步返回，不再支持 headers。
   */
  resolveAudioUrl(track: MediaTrack): string;
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
