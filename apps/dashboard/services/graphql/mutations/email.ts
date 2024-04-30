import { gql } from "@apollo/client"

import { apollo } from ".."
import {
  UserEmailDeleteDocument,
  UserEmailDeleteMutation,
  UserEmailRegistrationInitiateDocument,
  UserEmailRegistrationInitiateMutation,
  UserEmailRegistrationValidateDocument,
  UserEmailRegistrationValidateMutation,
} from "../generated"

gql`
  mutation UserEmailRegistrationInitiate($input: UserEmailRegistrationInitiateInput!) {
    userEmailRegistrationInitiate(input: $input) {
      emailRegistrationId
      errors {
        message
        code
      }
    }
  }

  mutation UserEmailRegistrationValidate($input: UserEmailRegistrationValidateInput!) {
    userEmailRegistrationValidate(input: $input) {
      errors {
        message
        code
      }
    }
  }

  mutation UserEmailDelete {
    userEmailDelete {
      errors {
        code
        message
      }
    }
  }
`

export async function emailRegistrationInitiate({
  email,
  token,
}: {
  email: string
  token: string
}) {
  const client = apollo(token).getClient()
  try {
    const { data } = await client.mutate<UserEmailRegistrationInitiateMutation>({
      mutation: UserEmailRegistrationInitiateDocument,
      variables: { input: { email } },
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: emailRegistrationInitiate ==> ", error)
    throw new Error("Error in emailRegistrationInitiate")
  }
}

export async function emailRegistrationValidate({
  emailRegistrationId,
  code,
  token,
}: {
  emailRegistrationId: string
  code: string
  token: string
}) {
  const client = apollo(token).getClient()
  try {
    const { data } = await client.mutate<UserEmailRegistrationValidateMutation>({
      mutation: UserEmailRegistrationValidateDocument,
      variables: {
        input: {
          code,
          emailRegistrationId,
        },
      },
    })
    return data
  } catch (error) {
    console.error("Error executing mutation: UserTotpRegistrationValidate ==> ", error)
    throw new Error("Error in UserTotpRegistrationValidate")
  }
}

export async function deleteEmail({ token }: { token: string }) {
  const client = apollo(token).getClient()
  try {
    const { data } = await client.mutate<UserEmailDeleteMutation>({
      mutation: UserEmailDeleteDocument,
    })
    return data
  } catch (error) {
    console.error("Error executing userEmailDelete mutation:", error)
    throw new Error("Error in userEmailDelete")
  }
}
