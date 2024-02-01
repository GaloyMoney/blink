import { revalidatePath } from "next/cache"

import { getClient } from "../../app/graphql-rsc"
import {
  AccountDetailsByAccountIdDocument,
  AccountDetailsByAccountIdQuery,
  AccountDetailsByAccountIdQueryVariables,
  AccountLevel,
  AccountStatus,
  AccountUpdateLevelDocument,
  AccountUpdateLevelMutation,
  AccountUpdateLevelMutationVariables,
  AccountUpdateStatusDocument,
  AccountUpdateStatusMutation,
  AccountUpdateStatusMutationVariables,
  AuditedAccount,
} from "../../generated"

import ConfirmForm from "./confirm"

type PropType = {
  auditedAccount: AuditedAccount
}

const updateLevel = async (formData: FormData) => {
  "use server"
  console.log("update level")

  const id = formData.get("id") as string
  const level = formData.get("level") as AccountLevel

  const { data } = await getClient().query<
    AccountDetailsByAccountIdQuery,
    AccountDetailsByAccountIdQueryVariables
  >({
    query: AccountDetailsByAccountIdDocument,
    variables: { accountId: id },
  })

  const auditedAccount = data?.accountDetailsByAccountId

  await getClient().mutate<
    AccountUpdateLevelMutation,
    AccountUpdateLevelMutationVariables
  >({
    mutation: AccountUpdateLevelDocument,
    variables: { input: { accountId: auditedAccount.id, level } },
  })

  revalidatePath("/account")
}

const updateStatus = async (formData: FormData) => {
  "use server"
  const id = formData.get("id") as string

  const { data } = await getClient().query<
    AccountDetailsByAccountIdQuery,
    AccountDetailsByAccountIdQueryVariables
  >({
    query: AccountDetailsByAccountIdDocument,
    variables: { accountId: id },
  })

  const auditedAccount = data?.accountDetailsByAccountId

  const targetStatus =
    auditedAccount.status === "ACTIVE" ? AccountStatus.Locked : AccountStatus.Active

  await getClient().mutate<
    AccountUpdateStatusMutation,
    AccountUpdateStatusMutationVariables
  >({
    mutation: AccountUpdateStatusDocument,
    variables: { input: { accountId: auditedAccount.id, status: targetStatus } },
  })

  revalidatePath("/account")
}

const AccountUpdate: React.FC<PropType> = ({ auditedAccount }) => {
  const isActiveStatus = auditedAccount.status === "ACTIVE"
  const statusButtonLabel = isActiveStatus ? "Lock" : "Activate"

  return (
    <div className="shadow p-6 min-w-0 rounded-lg shadow-xs overflow-hidden bg-white grid grid-cols-2 gap-4">
      <div>
        <p className="mb-4 font-semibold text-gray-600">Level</p>
        <div className={`text-gray-600`}>
          {auditedAccount.level}
          {auditedAccount.level === "ONE" && (
            <ConfirmForm
              action={updateLevel}
              message="Are you sure you want to upgrade the user to level 2?"
            >
              <input type="hidden" name="id" value={auditedAccount.id} />
              <input type="hidden" name="level" value={AccountLevel.Two} />
              <button className="text-sm mx-4 bg-green-500 hover:bg-green-700 text-white font-bold p-2 border border-green-700 rounded disabled:opacity-50">
                {"Upgrade"}
              </button>
            </ConfirmForm>
          )}
          {auditedAccount.level === "TWO" && (
            <ConfirmForm
              action={updateLevel}
              message="Are you sure you want to downgrade the user to level 1?"
            >
              <input type="hidden" name="id" value={auditedAccount.id} />
              <input type="hidden" name="level" value={AccountLevel.One} />
              <button className="text-sm mx-4 bg-green-500 hover:bg-green-700 text-white font-bold p-2 border border-green-700 rounded disabled:opacity-50">
                {"Downgrade"}
              </button>
            </ConfirmForm>
          )}
        </div>
      </div>
      <div>
        <p className="mb-4 font-semibold text-gray-600">Status</p>
        <div className={`text-gray-600`}>
          {auditedAccount.status}
          <ConfirmForm
            action={updateStatus}
            message="Are you sure you want to update the status?"
          >
            <input type="hidden" name="id" value={auditedAccount.id} />
            <button
              className={`text-sm mx-4 ${
                isActiveStatus
                  ? "bg-red-500 hover:bg-red-700 border-red-700"
                  : "bg-green-500 hover:bg-green-700 border-green-700"
              } text-white font-bold p-2 border rounded disabled:opacity-50`}
            >
              {statusButtonLabel}
            </button>
          </ConfirmForm>
        </div>
      </div>
    </div>
  )
}

export default AccountUpdate
