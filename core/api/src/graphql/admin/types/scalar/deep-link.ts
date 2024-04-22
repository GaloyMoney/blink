import { DeepLink as DomainDeepLink } from "@/domain/notifications"
import { GT } from "@/graphql/index"

const DeepLink = GT.Enum({
  name: "DeepLink",
  values: {
    CIRCLES: {
      value: DomainDeepLink.Circles,
    },
    PRICE: {
      value: DomainDeepLink.Price,
    },
    EARN: {
      value: DomainDeepLink.Earn,
    },
    MAP: {
      value: DomainDeepLink.Map,
    },
    PEOPLE: {
      value: DomainDeepLink.People,
    },
  },
})

export default DeepLink
