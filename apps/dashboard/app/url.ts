interface UrlInfo {
  title: string
  badge?: string
}

export const URLS: Record<string, UrlInfo> = {
  "/": { title: "Home" },
  "/transactions": { title: "Transactions" },
  "/security": { title: "Security" },
  "/security/email/add": { title: "Add Email" },
  "/security/email/verify": { title: "Verify Email" },
  "/api-keys": { title: "API Keys" },
  "/callback": { title: "Callback" },
  "/security/2fa/add": { title: "Add 2FA to Account" },
  "/batch-payments": { title: "Batch Payments", badge: "Alpha" },
}
