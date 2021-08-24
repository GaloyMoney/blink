import { GT } from "@graphql/index"
import AndroidVersions from "../object/android-versions"
import IosVersions from "../object/ios-versions"

const MobileVersions = new GT.Union({
  name: "MobileVersions",
  types: [AndroidVersions, IosVersions],
})

export default MobileVersions
