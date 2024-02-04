import { Merchants } from "../../components/merchants/details"
import {
  MerchantsPendingApprovalDocument,
  MerchantsPendingApprovalQuery,
  MerchantsPendingApprovalQueryVariables,
} from "../../generated"
import { getClient } from "../graphql-rsc"

export default async function () {
  const query = await getClient().query<
    MerchantsPendingApprovalQuery,
    MerchantsPendingApprovalQueryVariables
  >({
    query: MerchantsPendingApprovalDocument,
  })

  const merchants = query?.data.merchantsPendingApproval ?? []

  return (
    <>
      <h1 className="mx-6 mt-6 text-2xl font-semibold text-gray-700">
        {"Merchants pending validation"}
      </h1>
      <Merchants merchants={merchants} />
    </>
  )
}
