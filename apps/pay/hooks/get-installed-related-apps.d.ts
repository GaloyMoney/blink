interface InstalledAppInfo {
  id: string
}

interface Navigator {
  getInstalledRelatedApps: () => Promise<InstalledAppInfo[]>
}
