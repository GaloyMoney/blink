import { gql } from "@apollo/client";
import { apollo } from "..";
import {
  UserEmailDeleteDocument,
  UserEmailDeleteMutation,
  UserEmailRegistrationInitiateDocument,
  UserEmailRegistrationInitiateMutation,
  UserEmailRegistrationValidateDocument,
  UserEmailRegistrationValidateInput,
  UserEmailRegistrationValidateMutation,
} from "../generated";

gql`
  mutation UserEmailRegistrationInitiate(
    $input: UserEmailRegistrationInitiateInput!
  ) {
    userEmailRegistrationInitiate(input: $input) {
      emailRegistrationId
      errors {
        message
        code
      }
    }
  }
`;

gql`
  mutation UserEmailRegistrationValidate(
    $input: UserEmailRegistrationValidateInput!
  ) {
    userEmailRegistrationValidate(input: $input) {
      errors {
        message
        code
      }
    }
  }
`;

gql`
  mutation UserEmailDelete {
    userEmailDelete {
      errors {
        code
        message
      }
    }
  }
`;

export async function emailRegistrationInitiate(email: string, token: string) {
  const client = apollo(token).getClient();
  try {
    let errorMessages;
    const { data } = await client.mutate<UserEmailRegistrationInitiateMutation>(
      {
        mutation: UserEmailRegistrationInitiateDocument,
        variables: { input: { email } },
      }
    );
    if (data?.userEmailRegistrationInitiate.errors.length) {
      errorMessages = data?.userEmailRegistrationInitiate.errors.map(
        (err) => err.message
      );
      console.error(errorMessages);
      throw new Error("Error Initiating Totp Request");
    }

    return data;
  } catch (error) {
    console.error("Error executing mutation:", error);
    throw new Error("Error in emailRegistrationInitiate");
  }
}

export async function emailRegistrationValidate(
  code: string,
  emailRegistrationId: string,
  token: string
) {
  const client = apollo(token).getClient();
  try {
    let errorMessages;
    const { data } = await client.mutate<UserEmailRegistrationValidateMutation>(
      {
        mutation: UserEmailRegistrationValidateDocument,
        variables: {
          input: {
            code,
            emailRegistrationId,
          },
        },
      }
    );
    if (data?.userEmailRegistrationValidate.errors.length) {
      errorMessages = data?.userEmailRegistrationValidate.errors.map(
        (err) => err.message
      );
      console.error(errorMessages);
      throw new Error("Error Validating Totp Request");
    }

    return data;
  } catch (error) {
    console.error("Error executing mutation:", error);
    throw new Error("Error in UserTotpRegistrationValidate");
  }
}


export async function deleteEmail(
  token: string
) {
  const client = apollo(token).getClient();
  try {
    let errorMessages;
    const { data } = await client.mutate<UserEmailDeleteMutation>(
      {
        mutation: UserEmailDeleteDocument,
      }
    );
    if (data?.userEmailDelete.errors.length) {
      errorMessages = data?.userEmailDelete.errors.map((err) => err.message);
      console.error(errorMessages);
      throw new Error("Error userEmailDelete Request");
    }

    return data;
  } catch (error) {
    console.error("Error executing userEmailDelete mutation:", error);
    throw new Error("Error in userEmailDelete");
  }
}
