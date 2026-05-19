/**
 * Lightweight User-Agent parser and media organize format helpers.
 */

interface ParsedUA {
  browser: string;
  version: string;
  os: string;
  summary: string;
}

const BROWSER_PATTERNS: [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\/(\d+[\d.]*)/, "Edge"],
  [/OPR\/(\d+[\d.]*)/, "Opera"],
  [/Vivaldi\/(\d+[\d.]*)/, "Vivaldi"],
  [/YaBrowser\/(\d+[\d.]*)/, "Yandex"],
  [/SamsungBrowser\/(\d+[\d.]*)/, "Samsung Browser"],
  [/UCBrowser\/(\d+[\d.]*)/, "UC Browser"],
  [/Firefox\/(\d+[\d.]*)/, "Firefox"],
  [/Chrome\/(\d+[\d.]*)/, "Chrome"],
  [/Version\/(\d+[\d.]*).*Safari/, "Safari"],
  [/MSIE (\d+[\d.]*)/, "IE"],
  [/Trident\/.*rv:(\d+[\d.]*)/, "IE"],
];

const OS_PATTERNS: [RegExp, string][] = [
  [/Windows NT 10/, "Windows"],
  [/Windows NT 6\.3/, "Windows 8.1"],
  [/Windows NT 6\.[12]/, "Windows 7/8"],
  [/Windows/, "Windows"],
  [/Mac OS X (\d+[._]\d+)/, "macOS"],
  [/Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux.*Android (\d+)/, "Android"],
  [/Android/, "Android"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Linux/, "Linux"],
];

export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  if (!ua) return { browser: "", version: "", os: "", summary: "—" };

  let browser = "";
  let version = "";
  for (const [re, name] of BROWSER_PATTERNS) {
    const m = re.exec(ua);
    if (m) {
      browser = name;
      version = m[1].split(".")[0];
      break;
    }
  }

  let os = "";
  for (const [re, name] of OS_PATTERNS) {
    if (re.test(ua)) {
      os = name;
      break;
    }
  }

  const parts: string[] = [];
  if (browser) parts.push(version ? `${browser} ${version}` : browser);
  if (os) parts.push(os);
  const summary = parts.length > 0 ? parts.join(" / ") : ua.slice(0, 40);

  return { browser, version, os, summary };
}

// ─── Media organize format defaults ──────────────────────────────────────────

const DEFAULT_MOVIE_FOLDER = "{{name}} ({{year}})";
const DEFAULT_MOVIE_FILE =
  "{{name}} ({{year}}){% if version %} - {{version}}{% endif %}";
const DEFAULT_TV_FOLDER = "{{name}} ({{year}})";
const DEFAULT_TV_FILE =
  "{{name}} S{{season}}E{{ep_start}}{% if ep_end %}-E{{ep_end}}{% endif %}{% if version %} - {{version}}{% endif %}";
const DEFAULT_ADULT_FOLDER = "{{series}}/{{video_id}}";
const DEFAULT_ADULT_FILE = "{{video_id}}";
const DEFAULT_MUSIC_FOLDER =
  "{{artist}}/{{album}}{% if year %} ({{year}}){% endif %}";
const DEFAULT_MUSIC_FILE = "{{track}}. {{title}}";
const DEFAULT_ONLINE_VIDEO_FOLDER = "{{source_site}}/{{source_id}}";
const DEFAULT_ONLINE_VIDEO_FILE = "{{source_id}}";

export function getDefaultFolderFormat(ct: string): string {
  switch (ct) {
    case "movie":
    case "documentary":
      return DEFAULT_MOVIE_FOLDER;
    case "tv":
    case "anime":
    case "variety":
      return DEFAULT_TV_FOLDER;
    case "adult":
      return DEFAULT_ADULT_FOLDER;
    case "music":
    case "audiobook":
    case "podcast":
      return DEFAULT_MUSIC_FOLDER;
    case "online_video":
    case "concert":
    case "online_course":
      return DEFAULT_ONLINE_VIDEO_FOLDER;
    default:
      return DEFAULT_MOVIE_FOLDER;
  }
}

export function getDefaultFileFormat(ct: string): string {
  switch (ct) {
    case "movie":
    case "documentary":
      return DEFAULT_MOVIE_FILE;
    case "tv":
    case "anime":
    case "variety":
      return DEFAULT_TV_FILE;
    case "adult":
      return DEFAULT_ADULT_FILE;
    case "music":
    case "audiobook":
    case "podcast":
      return DEFAULT_MUSIC_FILE;
    case "online_video":
    case "concert":
    case "online_course":
      return DEFAULT_ONLINE_VIDEO_FILE;
    default:
      return DEFAULT_MOVIE_FILE;
  }
}
