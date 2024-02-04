import { revalidatePath } from "next/cache"
import { getClient } from "../../app/graphql-rsc"

import {
  MerchantMapDeleteDocument,
  MerchantMapDeleteMutation,
  MerchantMapDeleteMutationVariables,
  MerchantMapValidateDocument,
  MerchantMapValidateMutation,
  MerchantMapValidateMutationVariables,
} from "../../generated"

export const deleteMerchant = async (formData: FormData) => {
  "use server"
  console.log("delete merchant")

  const id = formData.get("id") as string

  await getClient().mutate<MerchantMapDeleteMutation, MerchantMapDeleteMutationVariables>(
    {
      mutation: MerchantMapDeleteDocument,
      variables: { input: { id } },
    },
  )

  revalidatePath("/account")
}

export const validateMerchant = async (formData: FormData) => {
  "use server"
  console.log("validate merchant")

  const id = formData.get("id") as string

  await getClient().mutate<MerchantMapValidateMutation, MerchantMapValidateMutationVariables>(
    {
      mutation: MerchantMapValidateDocument,
      variables: { input: { id } },
    },
  )

  revalidatePath("/account")
}
