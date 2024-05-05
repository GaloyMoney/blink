import { DeepLinkAction as DomainDeepLinkAction } from "@/domain/notifications"
import { GT } from "@/graphql/index"

const DeepLinkAction = GT.Enum({
  name: "DeepLinkAction",
  values: {
    SET_LN_ADDRESS_MODAL: {
      value: DomainDeepLinkAction.SetLnAddressModal,
    },
    SET_DEFAULT_ACCOUNT_MODAL: {
      value: DomainDeepLinkAction.SetDefaultAccountModal,
    },
    UPGRADE_ACCOUNT_MODAL: {
      value: DomainDeepLinkAction.UpgradeAccountModal,
    },
  },
})

export default DeepLinkAction
