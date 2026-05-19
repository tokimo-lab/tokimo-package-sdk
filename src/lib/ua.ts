/** Lightweight User-Agent parser. */

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
