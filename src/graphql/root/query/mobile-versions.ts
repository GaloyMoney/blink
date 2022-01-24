import { GT } from "@graphql/index"

import MobileVersions from "@graphql/types/object/mobile-versions"
import { getBuildVersions } from "@config"

const MobileVersionsQuery = GT.Field({
  type: GT.List(MobileVersions),
  resolve: async () => {
    const {
      minBuildNumberAndroid,
      lastBuildNumberAndroid,
      minBuildNumberIos,
      lastBuildNumberIos,
    } = getBuildVersions()

    return [
      {
        platform: "android",
        currentSupported: lastBuildNumberAndroid,
        minSupported: minBuildNumberAndroid,
      },
      {
        platform: "ios",
        currentSupported: lastBuildNumberIos,
        minSupported: minBuildNumberIos,
      },
    ]
  },
})

export default MobileVersionsQuery
