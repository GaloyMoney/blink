interface UrlInfo {
  title: string
  protected: boolean
}

export const URLS: Record<string, UrlInfo> = {
  "/": { title: "Home", protected: true },
  "/transactions": { title: "Transactions", protected: true },
  "/security": { title: "Security", protected: true },
  "/security/email/add": { title: "Add Email", protected: true },
  "/security/email/verify": { title: "Verify Email", protected: true },
  "/api-keys": { title: "API Keys", protected: true },
  "/callback": { title: "Callback", protected: true },
}
