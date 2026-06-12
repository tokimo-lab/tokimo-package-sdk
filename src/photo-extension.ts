/**
 * PhotoExtension — AI-only extension slots for the Photo Viewer.
 *
 * External apps (e.g. tokimo-app-photo) register implementations at mount time
 * via `ctx.shell.photo.registerExtension(appId, ext)`. The monolith owns image
 * loading, zoom/pan, HEIC/live photo, navigation, and info panel structure;
 * extensions only inject app-specific AI UI.
 */

import type { ReactNode, RefObject } from "react";

/**
 * Minimal photo metadata passed to extension methods.
 * Deliberately decoupled from PhotoOutput (which is app-specific).
 */
export interface PhotoInfo {
  id: string;
  filename: string;
  title?: string | null;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  mimeType?: string | null;
  takenAt?: string | null;
  isFavorite?: boolean;
  orientation?: number | null;
  liveVideoPath?: string | null;
  sourceId?: string | null;
  appId?: string | null;
  path?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAltitude?: number | null;
  locationName?: string | null;
  geoAddress?: string | null;
  geoProvince?: string | null;
  geoCity?: string | null;
  geoDistrict?: string | null;
  geoTownship?: string | null;
  ocrScannedAt?: string | null;
  description?: string | null;
}

/** Display-space values for overlay slots. */
export interface PhotoDisplayContext {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  rotation: number;
  zoom: number;
  panX: number;
  panY: number;
  imgRef: RefObject<HTMLImageElement | null>;
}

/**
 * Extension contract for app-specific Photo Viewer AI UI.
 * All methods are optional — implement only what the app needs.
 */
export interface PhotoExtension {
  /** Render overlay layers on top of the displayed image. */
  renderImageOverlays?: (
    photo: PhotoInfo,
    ctx: PhotoDisplayContext,
  ) => ReactNode;

  /** Render extra AI fields at the bottom of the right-side info panel. */
  renderInfoPanelExtras?: (photo: PhotoInfo) => ReactNode;

  /** Render AI toolbar buttons. */
  renderToolbarAiButtons?: (photo: PhotoInfo) => ReactNode;
}
