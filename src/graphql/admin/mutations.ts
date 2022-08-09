import { getAccountsConfig } from "@config"

import { GT } from "@graphql/index"

import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import UserLoginMutation from "@graphql/root/mutation/user-login"
import CaptchaRequestAuthCodeMutation from "@graphql/root/mutation/captcha-request-auth-code"
import CaptchaCreateChallengeMutation from "@graphql/root/mutation/captcha-create-challenge"
import AccountUpdateLevelMutation from "@graphql/admin/root/mutation/account-update-level"
import AccountUpdateStatusMutation from "@graphql/admin/root/mutation/account-update-status"
import AccountsAddUsdWalletMutation from "@graphql/admin/root/mutation/account-add-usd-wallet"
import AccountCustomFieldsUpdateMutation from "@graphql/admin/root/mutation/account-custom-fields-update"
import BusinessUpdateMapInfoMutation from "@graphql/admin/root/mutation/business-update-map-info"
import ColdStorageRebalanceToHotWalletMutation from "@graphql/admin/root/mutation/cold-storage-rebalance-to-hot-wallet"

import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ACCOUNT_USERNAME,
} from "@services/tracing"

const fields = {
  userRequestAuthCode: UserRequestAuthCodeMutation,
  userLogin: UserLoginMutation,

  captchaCreateChallenge: CaptchaCreateChallengeMutation,
  captchaRequestAuthCode: CaptchaRequestAuthCodeMutation,

  accountUpdateLevel: AccountUpdateLevelMutation,
  accountUpdateStatus: AccountUpdateStatusMutation,
  accountsAddUsdWallet: AccountsAddUsdWalletMutation,

  businessUpdateMapInfo: BusinessUpdateMapInfoMutation,

  coldStorageRebalanceToHotWallet: ColdStorageRebalanceToHotWalletMutation,
}

const { customFields } = getAccountsConfig()
if (customFields && customFields.length > 0) {
  Object.assign(fields, { accountCustomFieldsUpdate: AccountCustomFieldsUpdateMutation })
}

const addTracing = () => {
  for (const key in fields) {
    // @ts-ignore-next-line no-implicit-any error
    const original = fields[key].resolve
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    fields[key].resolve = (source, args, context, info) => {
      const { ip, domainAccount, domainUser } = context || {}
      return addAttributesToCurrentSpanAndPropagate(
        {
          [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
          [ACCOUNT_USERNAME]: domainAccount?.username,
          [SemanticAttributes.HTTP_CLIENT_IP]: ip,
        },
        // @ts-ignore-next-line no-implicit-any error
        () => original(source, args, context, info),
      )
    }
  }
  return fields
}

const MutationType = GT.Object({
  name: "Mutation",
  fields: () => addTracing(),
})

export default MutationType
