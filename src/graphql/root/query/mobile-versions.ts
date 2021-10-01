import { GT } from "@graphql/index"

import MobileVersions from "@graphql/types/object/mobile-versions"
import { getBuildVersionNumbers } from "@services/local-cache"

const MobileVersionsQuery = GT.Field({
  type: GT.List(MobileVersions),
  resolve: async () => {
    const versionNumbers = await getBuildVersionNumbers()

    if (versionNumbers instanceof Error) {
      throw versionNumbers
    }

    const { minBuildNumber, lastBuildNumber } = versionNumbers

    return [
      {
        platform: "android",
        currentSupported: lastBuildNumber,
        minSupported: minBuildNumber,
      },
      {
        platform: "ios",
        currentSupported: lastBuildNumber,
        minSupported: minBuildNumber,
      },
    ]
  },
})

export default MobileVersionsQuery
