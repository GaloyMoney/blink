import { gql } from "@apollo/client"

import { apolloClient } from ".."
import {
  UserTotpDeleteDocument,
  UserTotpDeleteMutation,
  UserTotpRegistrationInitiateDocument,
  UserTotpRegistrationInitiateMutation,
  UserTotpRegistrationValidateDocument,
  UserTotpRegistrationValidateMutation,
} from "../generated"

gql`
  mutation UserTotpRegistrationInitiate {
    userTotpRegistrationInitiate {
      totpRegistrationId
      totpSecret
      errors {
        code
        message
        path
      }
    }
  }

  mutation UserTotpDelete {
    userTotpDelete {
      errors {
        code
        message
        path
      }
    }
  }

  mutation UserTotpRegistrationValidate($input: UserTotpRegistrationValidateInput!) {
    userTotpRegistrationValidate(input: $input) {
      errors {
        code
        message
        path
      }
      me {
        id
      }
    }
  }
`

export async function userTotpRegistrationInitiate() {
  const client = await apolloClient.authenticated()
  try {
    const { data } = await client.mutate<UserTotpRegistrationInitiateMutation>({
      mutation: UserTotpRegistrationInitiateDocument,
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: UserTotpRegistrationInitiate ==> ", error)
    throw new Error("Error in UserTotpRegistrationInitiate")
  }
}

export async function userTotpRegistrationValidate({
  totpRegistrationId,
  totpCode,
}: {
  totpRegistrationId: string
  totpCode: string
}) {
  const client = await apolloClient.authenticated()
  try {
    const { data } = await client.mutate<UserTotpRegistrationValidateMutation>({
      mutation: UserTotpRegistrationValidateDocument,
      variables: {
        input: {
          totpRegistrationId,
          totpCode,
        },
      },
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: UserTotpRegistrationValidate ==> ", error)
    throw new Error("Error in UserTotpRegistrationValidate")
  }
}

export async function userTotpDelete() {
  const client = await apolloClient.authenticated()
  try {
    const { data } = await client.mutate<UserTotpDeleteMutation>({
      mutation: UserTotpDeleteDocument,
    })
    return data
  } catch (error) {
    console.error("Error executing UserTotpDelete mutation:", error)
    throw new Error("Error in UserTotpDelete")
  }
}
