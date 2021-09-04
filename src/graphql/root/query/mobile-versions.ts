import { GT } from "@graphql/index"

import MobileVersions from "@graphql/types/object/mobile-versions"
import { getMinBuildNumber } from "@services/local-cache"

const MobileVersionsQuery = GT.Field({
  type: GT.List(MobileVersions),
  resolve: async () => {
    const { minBuildNumber, lastBuildNumber } = await getMinBuildNumber()

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
