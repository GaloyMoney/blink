import { useState, useEffect } from "react"

function useCheckInstalledApps({ appId }: { appId: string }): boolean {
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  useEffect(() => {
    const checkInstalledApps = async () => {
      try {
        if ("getInstalledRelatedApps" in navigator) {
          const apps = await navigator.getInstalledRelatedApps()
          const foundApp = apps.some((app) => app.id === appId)
          setIsAppInstalled(foundApp)
        } else {
          console.error("getInstalledRelatedApps is not supported in this browser.")
        }
      } catch (error) {
        console.error("Error checking installed related apps:", error)
      }
    }

    checkInstalledApps()
  }, [appId])

  return isAppInstalled
}

export default useCheckInstalledApps
