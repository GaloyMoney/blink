type KratosAuthResponse = {
  sessionToken: KratosSessionToken
  kratosUserId: KratosUserId
}

type LoginForPhoneNoPasswordSchemaResponse = KratosAuthResponse

type CreateKratosUserForPhoneNoPasswordSchemaResponse = KratosAuthResponse
