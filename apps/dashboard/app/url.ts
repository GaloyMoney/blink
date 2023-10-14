interface UrlInfo {
  title: string;
  protected: boolean;
}

const URLS: Record<string, UrlInfo> = {
  "/": { title: "Home", protected: true },
  "/transaction": { title: "Transaction", protected: true },
};

export function getTitle(path: string): string {
  const urlInfo = URLS[path];
  if (urlInfo) {
    return urlInfo.title;
  }
  return "Path not found";
}
