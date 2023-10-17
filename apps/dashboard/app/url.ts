interface UrlInfo {
  title: string;
  protected: boolean;
}

export const URLS: Record<string, UrlInfo> = {
  "/": { title: "Home", protected: true },
  "/transactions": { title: "Transactions", protected: true },
};
