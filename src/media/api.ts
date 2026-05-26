import type {
  MediaCenterSnapshot,
  MediaProviderHandle,
  MediaTrack,
  PlayInput,
  RepeatMode,
} from "./types";

/**
 * 系统级 Media Center API。整个系统只有一个 active player；任何
 * provider 调 play() 都会立刻顶掉前一个（互顶 = mutually preemptive）。
 */
export interface ShellMediaCenterApi {
  /**
   * Provider 启动时注册自己；返回 unregister 函数。同一 providerId 重复注册
   * 会覆盖前者（dispose 旧的）。
   */
  registerProvider(providerId: string, handle: MediaProviderHandle): () => void;

  /**
   * 开始播放一个 queue。立即顶掉当前 active provider（暂停其 audio，切换
   * activeProviderId）。如果 providerId 未注册返回 rejected promise。
   */
  play(input: PlayInput): Promise<void>;

  pause(): void;
  resume(): void;
  /** 跳转到当前曲目某位置（毫秒）。 */
  seek(timeMs: number): void;
  /** 跳下一首（按 shuffle/repeat 算法）。 */
  next(): void;
  /** 上一首（同上）。 */
  previous(): void;
  /** 跳到 queue 中指定 index。 */
  skipToIndex(index: number): void;
  setShuffle(on: boolean): void;
  setRepeat(mode: RepeatMode): void;
  /**
   * 整体替换 queue（保持当前曲目继续播放，currentIndex 重新定位到新 queue
   * 中相同 id 的位置；找不到则播放新 queue[startIndex]）。
   */
  setQueue(queue: MediaTrack[], startIndex?: number): void;
  setVolume(v: number): void;

  /** 即时读快照（null = 无 active）。 */
  getSnapshot(): MediaCenterSnapshot | null;
  /** 订阅 snapshot 变化（每次 setState 都触发）。返回 unsubscribe。 */
  subscribe(
    listener: (snapshot: MediaCenterSnapshot | null) => void,
  ): () => void;
  /** 可视化用 AnalyserNode（懒创建，需先 play 过一次）。 */
  getAnalyser(): AnalyserNode | null;

  /**
   * 局部更新当前 active provider 的 snapshot（仅当 snapshot.providerId 匹配时生效）。
   * 用于 provider 自管理播放元素时推送进度更新（如 video-player）。
   */
  updateProviderSnapshot(
    providerId: string,
    patch: Partial<MediaCenterSnapshot>,
  ): void;

  /**
   * 激活某 provider 为当前 active source。会暂停前一个 provider（优先调用其 commands.pause，
   * 否则 audio.pause），但**不触发** audio src 切换。适用于 provider 管理自己播放元素的场景。
   */
  activateProviderSource(
    providerId: string,
    initialSnapshot: MediaCenterSnapshot,
  ): void;

  /**
   * 取消激活指定 provider（若当前 active 才清空 snapshot）。
   */
  deactivateProviderSource(providerId: string): void;
}
