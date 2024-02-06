import Details from "../../../components/account/details"
import AccountUpdate from "../../../components/account/update"
import { Merchants } from "../../../components/merchants/details"
import {
  AccountDetailsByAccountIdDocument,
  AccountDetailsByAccountIdQuery,
  AccountDetailsByAccountIdQueryVariables,
} from "../../../generated"
import { getClient } from "../../graphql-rsc"

export default async function AccountDetails({ params }: { params: { uuid: string } }) {
  const { data } = await getClient().query<
    AccountDetailsByAccountIdQuery,
    AccountDetailsByAccountIdQueryVariables
  >({
    query: AccountDetailsByAccountIdDocument,
    variables: { accountId: params.uuid },
  })

  const auditedAccount = data?.accountDetailsByAccountId

  return (
    auditedAccount && (
      <>
        <h1 className="mx-6 mt-6 text-2xl font-semibold text-gray-700">
          {"Account details"}
        </h1>
        <div className="grid gap-6 mb-8 md:grid-cols-2 p-6">
          <Details auditedAccount={auditedAccount} />
          <div className="grid grid-cols-1 gap-4">
            <AccountUpdate auditedAccount={auditedAccount} />
          </div>
        </div>
        <Merchants merchants={auditedAccount.merchants} />
      </>
    )
  )
}
