export type MediaImageInput =
  | {
      kind: "vfs";
      sourceId: string;
      path: string;
      filename?: string | null;
    }
  | {
      kind: "storageKey";
      key: string;
      filename?: string | null;
    }
  | {
      kind: "inlineBase64";
      dataBase64: string;
      filename?: string | null;
    };

export type MediaAnalysisType = "ocr" | "face" | "clip" | "gps" | "all";

export interface MediaAnalyzeImageRequest {
  image: MediaImageInput;
  analysisType: MediaAnalysisType;
  requestId?: string | null;
  ocrModelName?: string | null;
  ocrAuxModelName?: string | null;
}

export interface MediaOcrImageRequest {
  image: MediaImageInput;
  requestId?: string | null;
  modelName?: string | null;
  auxModelName?: string | null;
}

export interface MediaFaceDetectRequest {
  image: MediaImageInput;
  requestId?: string | null;
}

export interface MediaEmbedImageRequest {
  image: MediaImageInput;
  requestId?: string | null;
}

export interface MediaEmbedTextRequest {
  text: string;
  requestId?: string | null;
}

export interface MediaClassifyVectorRequest {
  vector: number[];
}

export interface MediaGpsExtractRequest {
  image: MediaImageInput;
}

export interface MediaReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface MediaCancelRequest {
  requestId: string;
}

export interface MediaHealthResponse {
  status: string;
  workerReady: boolean;
  ocrReady: boolean;
  faceReady: boolean;
  clipReady: boolean;
}

export interface MediaOcrItem {
  text: string;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  angle: number;
  score: number | null;
  paragraphId: number;
  charPositions: unknown | null;
  positioningType: string;
  corners: [number, number][] | null;
}

export interface MediaOcrResult {
  items: MediaOcrItem[];
}

export interface MediaFaceItem {
  bbox: number[];
  confidence: number;
  embedding: number[] | null;
}

export interface MediaFaceResult {
  faces: MediaFaceItem[];
}

export interface MediaClipResult {
  embedding: number[];
}

export interface MediaClipTagResult {
  category: string;
  icon: string;
  subcategory: string;
  score: number;
}

export interface MediaClipClassifyResult {
  tags: MediaClipTagResult[];
}

export interface MediaGpsResult {
  latitude: number;
  longitude: number;
  altitude: number | null;
  province: string | null;
  city: string | null;
  district: string | null;
  formattedAddress: string | null;
}

export interface MediaAnalyzeImageResponse {
  ocr: MediaOcrResult | null;
  face: MediaFaceResult | null;
  clip: MediaClipResult | null;
  gps: MediaGpsResult | null;
  errors: Record<string, unknown>;
}

export interface ShellMediaIntelligenceApi {
  health(): Promise<MediaHealthResponse>;
  analyzeImage(input: MediaAnalyzeImageRequest): Promise<MediaAnalyzeImageResponse>;
  ocrImage(input: MediaOcrImageRequest): Promise<MediaOcrResult>;
  detectFaces(input: MediaFaceDetectRequest): Promise<MediaFaceResult>;
  embedImage(input: MediaEmbedImageRequest): Promise<MediaClipResult>;
  embedText(input: MediaEmbedTextRequest): Promise<MediaClipResult>;
  classifyVector(input: MediaClassifyVectorRequest): Promise<MediaClipClassifyResult>;
  extractGps(input: MediaGpsExtractRequest): Promise<MediaGpsResult | null>;
  reverseGeocode(input: MediaReverseGeocodeRequest): Promise<MediaGpsResult>;
  cancel(input: MediaCancelRequest): Promise<void>;
}
