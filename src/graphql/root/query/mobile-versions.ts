import { GT } from "@graphql/index"

import MobileVersions from "@graphql/types/object/mobile-versions"
import { getBuildVersions } from "@config/app"

const MobileVersionsQuery = GT.Field({
  type: GT.List(MobileVersions),
  resolve: async () => {
    const { minBuildNumber, lastBuildNumber } = getBuildVersions()

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
