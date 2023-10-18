// import { gql } from "@apollo/client";
// import {
//   UserTotpRegistrationInitiateDocument,
//   UserTotpRegistrationInitiateInput,
//   UserTotpRegistrationInitiateMutation,
//   UserTotpRegistrationValidateDocument,
//   UserTotpRegistrationValidateInput,
//   UserTotpRegistrationValidateMutation,
// } from "../generated";
// import { apollo } from "..";

// gql`
//   mutation UserTotpRegistrationInitiate(
//     $input: UserTotpRegistrationInitiateInput!
//   ) {
//     userTotpRegistrationInitiate(input: $input) {
//       totpRegistrationId
//       totpSecret
//       errors {
//         code
//         message
//       }
//     }
//   }
// `;

// gql`
//   mutation UserTotpRegistrationValidate(
//     $input: UserTotpRegistrationValidateInput!
//   ) {
//     userTotpRegistrationValidate(input: $input) {
//       errors {
//         message
//         code
//       }
//     }
//   }
// `;

// export async function totpRegistrationInitiate(token: string) {
//   const client = apollo(token).getClient();
//   try {
//     let errorMessages;
//     const { data } = await client.mutate<UserTotpRegistrationInitiateMutation>({
//       mutation: UserTotpRegistrationInitiateDocument,
//       variables: { input: { authToken: token } },
//     });
//     if (data?.userTotpRegistrationInitiate.errors.length) {
//       errorMessages = data?.userTotpRegistrationInitiate.errors.map(
//         (err) => err.message
//       );
//       console.error(errorMessages);
//       throw new Error("Error Initiating Totp Request");
//     }

//     return data;
//   } catch (error) {
//     console.error("Error executing mutation:", error);
//     throw new Error("Error in UserTotpRegistrationInitiate");
//   }
// }

// export async function totpRegistrationValidate(
//   input: UserTotpRegistrationValidateInput,
//   token: string
// ) {
//   const client = apollo(token).getClient();
//   try {
//     let errorMessages;
//     const { data } = await client.mutate<UserTotpRegistrationValidateMutation>({
//       mutation: UserTotpRegistrationValidateDocument,
//       variables: { input },
//     });
//     if (data?.userTotpRegistrationValidate.errors.length) {
//       errorMessages = data?.userTotpRegistrationValidate.errors.map(
//         (err) => err.message
//       );
//       console.error(errorMessages);
//       throw new Error("Error Validating Totp Request");
//     }

//     return data;
//   } catch (error) {
//     console.error("Error executing mutation:", error);
//     throw new Error("Error in UserTotpRegistrationValidate");
//   }
// }
