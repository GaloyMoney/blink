import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client/core"
import { elevatingSessionWithTotp } from "@app/authentication"
import { UuidRegex } from "@services/kratos"

import { sleep } from "@utils"
import axios from "axios"
import { authenticator } from "otplib"

import {
  EmailDocument,
  EmailQuery,
  UserEmailDeleteDocument,
  UserEmailDeleteMutation,
  UserEmailSetDocument,
  UserEmailSetMutation,
  UserEmailVerifyDocument,
  UserEmailVerifyMutation,
  UserPhoneDeleteDocument,
  UserPhoneDeleteMutation,
  UserPhoneSetDocument,
  UserPhoneSetMutation,
  UserPhoneVerifyDocument,
  UserPhoneVerifyMutation,
  UserTotpRegistrationInitiateDocument,
  UserTotpRegistrationInitiateMutation,
  UserTotpRegistrationValidateDocument,
  UserTotpRegistrationValidateMutation,
} from "test/e2e/generated"
import {
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  initializeTestingState,
  killServer,
  startServer,
} from "test/e2e/helpers"
import { loginFromPhoneAndCode } from "test/e2e/helpers/account-creation"
import {
  clearAccountLocks,
  clearLimiters,
  getPhoneAndCodeFromRef,
  randomEmail,
} from "test/helpers"

import { OATHKEEPER_HOST, OATHKEEPER_PORT } from "test/helpers/env"
import { getEmailCode, getEmailCount } from "test/helpers/kratos"

const userRef = "P"
const { phone, code } = getPhoneAndCodeFromRef(userRef)

let apolloClient: ApolloClient<NormalizedCacheObject>,
  disposeClient: () => void = () => null,
  serverPid: PID,
  triggerPid: PID

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")
  triggerPid = await startServer("start-trigger-ci")
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  disposeClient()
  await killServer(serverPid)
  await killServer(triggerPid)

  await sleep(2000)
})

gql`
  mutation userEmailSet($input: UserEmailSetInput!) {
    userEmailSet(input: $input) {
      errors {
        message
      }
      flow
      me {
        id
        email {
          address
          verified
        }
      }
    }
  }

  mutation userEmailVerify($input: UserEmailVerifyInput!) {
    userEmailVerify(input: $input) {
      errors {
        message
      }
      me {
        id
        email {
          address
          verified
        }
      }
    }
  }

  mutation userEmailDelete {
    userEmailDelete {
      errors {
        message
      }
      me {
        id
        email {
          address
          verified
        }
      }
    }
  }

  mutation userPhoneDelete {
    userPhoneDelete {
      errors {
        message
      }
      me {
        id
        phone
      }
    }
  }

  mutation userTotpRegistrationInitiate($input: UserTotpRegistrationInitiateInput!) {
    userTotpRegistrationInitiate(input: $input) {
      errors {
        message
      }
      flow
      totpSecret
    }
  }

  mutation userTotpRegistrationValidate($input: UserTotpRegistrationValidateInput!) {
    userTotpRegistrationValidate(input: $input) {
      errors {
        message
      }
      me {
        totpEnabled
        email {
          address
          verified
        }
      }
    }
  }

  mutation userPhoneSet($input: UserPhoneSetInput!) {
    userPhoneSet(input: $input) {
      errors {
        message
      }
      success
    }
  }

  mutation userPhoneVerify($input: UserPhoneVerifyInput!) {
    userPhoneVerify(input: $input) {
      errors {
        message
      }
      me {
        id
      }
    }
  }

  query email {
    me {
      email {
        address
        verified
      }
      totpEnabled
    }
  }
`

const urlEmailCodeRequest = `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/email/code-request`
const urlEmailLogin = `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/email/login`

let totpSecret: string

describe("auth", () => {
  let email: EmailAddress
  let authToken: SessionToken

  it("create user", async () => {
    ;({ apolloClient, disposeClient, authToken } = await loginFromPhoneAndCode({
      phone,
      code,
    }))
    expect(apolloClient).not.toBeNull()

    const emailQueryRes = await apolloClient.query<EmailQuery>({
      query: EmailDocument,
      fetchPolicy: "network-only",
    })

    expect(emailQueryRes?.data?.me?.email?.address).toBe(null)
  })

  it("add email", async () => {
    email = randomEmail()

    const emailSetRes = await apolloClient.mutate<UserEmailSetMutation>({
      mutation: UserEmailSetDocument,
      variables: { input: { email } },
    })

    const flow = emailSetRes.data?.userEmailSet.flow
    expect(flow).toMatch(UuidRegex)

    const code = await getEmailCode({ email })
    expect(code).not.toBeNull()

    const count = await getEmailCount({ email })
    expect(count).toBe(1)

    {
      const emailQueryRes = await apolloClient.query<EmailQuery>({
        query: EmailDocument,
        fetchPolicy: "network-only",
      })

      expect(emailQueryRes?.data?.me?.email?.address).toBe(email)
      expect(emailQueryRes?.data?.me?.email?.verified).toBe(false)
      expect(emailQueryRes?.data?.me?.totpEnabled).toBe(false)
    }

    {
      const emailSetRes = await apolloClient.mutate<UserEmailSetMutation>({
        mutation: UserEmailSetDocument,
        variables: { input: { email } },
      })

      expect(emailSetRes.data?.userEmailSet.errors).toEqual([
        {
          message:
            "An email is already attached to this account. It's only possible to attach one email per account",
          __typename: "GraphQLApplicationError",
        },
      ])
    }

    const emailVerifyRes = await apolloClient.mutate<UserEmailVerifyMutation>({
      mutation: UserEmailVerifyDocument,
      variables: { input: { code, flow } },
    })

    expect(emailVerifyRes.data?.userEmailVerify.me?.email?.address).toBe(email)
    expect(emailVerifyRes.data?.userEmailVerify.me?.email?.verified).toBe(true)
  })

  it("log in with email", async () => {
    // code request
    const res = await axios({
      url: urlEmailCodeRequest,
      method: "POST",
      data: {
        email,
      },
    })

    const flow = res.data.result
    expect(flow).not.toBeNull()

    const code = await getEmailCode({ email })
    expect(code).not.toBeNull()

    // validate code
    const res2 = await axios({
      url: urlEmailLogin,
      method: "POST",
      data: {
        code,
        flow,
      },
    })
    expect(res2).not.toBeNull()
    expect(res2.data.result.sessionToken.length).toBe(39)

    // TODO: check the response when the login request has expired
  })

  it("remove email", async () => {
    const countInit = await getEmailCount({ email })
    expect(countInit).toBe(2)

    const emailDeleteRes = await apolloClient.mutate<UserEmailDeleteMutation>({
      mutation: UserEmailDeleteDocument,
    })

    expect(emailDeleteRes.data?.userEmailDelete.me?.email?.address).toBe(null)
    expect(emailDeleteRes.data?.userEmailDelete.me?.email?.verified).toBe(false)

    // code request should still work
    const url = `http://${OATHKEEPER_HOST}:${OATHKEEPER_PORT}/auth/email/code-request`

    const res2 = await axios({
      url,
      method: "POST",
      data: {
        email,
      },
    })

    const flowId = res2.data.result
    expect(flowId).toMatch(UuidRegex)

    const emailQueryRes = await apolloClient.query<EmailQuery>({
      query: EmailDocument,
      fetchPolicy: "network-only",
    })

    expect(emailQueryRes?.data?.me?.email?.address).toBe(null)
    expect(emailQueryRes?.data?.me?.totpEnabled).toBe(false)

    // no email should be sent
    const count = await getEmailCount({ email })
    expect(count).toBe(countInit)

    // TODO: email to the sender highlighting the email was removed
  })

  it("remove phone login", async () => {
    // add back the email
    const emailSetRes = await apolloClient.mutate<UserEmailSetMutation>({
      mutation: UserEmailSetDocument,
      variables: { input: { email } },
    })

    const flow = emailSetRes.data?.userEmailSet.flow
    const code = await getEmailCode({ email })

    await apolloClient.mutate<UserEmailVerifyMutation>({
      mutation: UserEmailVerifyDocument,
      variables: { input: { code, flow } },
    })

    {
      const emailQueryRes = await apolloClient.query<EmailQuery>({
        query: EmailDocument,
        fetchPolicy: "network-only",
      })

      expect(emailQueryRes?.data?.me?.email?.address).toBe(email)
      expect(emailQueryRes?.data?.me?.email?.verified).toBe(true)
    }

    // remove phone
    const removePhoneRes = await apolloClient.mutate<UserPhoneDeleteMutation>({
      mutation: UserPhoneDeleteDocument,
    })

    expect(removePhoneRes.data?.userPhoneDelete.me?.phone).toBe(null)

    // can't log in with phone
    await expect(loginFromPhoneAndCode({ phone, code })).rejects.toThrow()
  })

  it("adding totp", async () => {
    const res = await apolloClient.mutate<UserTotpRegistrationInitiateMutation>({
      mutation: UserTotpRegistrationInitiateDocument,
      variables: { input: { authToken } },
    })

    expect(res.data?.userTotpRegistrationInitiate.flow).toMatch(UuidRegex)
    expect(res.data?.userTotpRegistrationInitiate.totpSecret).not.toBeNull()

    totpSecret = res.data?.userTotpRegistrationInitiate?.totpSecret || ""

    const res2 = await apolloClient.mutate<UserTotpRegistrationValidateMutation>({
      mutation: UserTotpRegistrationValidateDocument,
      variables: {
        input: {
          totpCode: authenticator.generate(totpSecret),
          flow: res.data?.userTotpRegistrationInitiate.flow,
          authToken,
        },
      },
    })

    expect(res2.data?.userTotpRegistrationValidate).toMatchObject({
      errors: [],
      me: {
        totpEnabled: true,
        email: {
          address: email,
          verified: true,
        },
      },
    })
  })

  it("removing totp", async () => {
    expect(true).toBe(true) // TODO
  })

  it("log in with email with totp activated", async () => {
    // code request
    const res = await axios({
      url: urlEmailCodeRequest,
      method: "POST",
      data: {
        email,
      },
    })

    const flow = res.data.result
    expect(flow).not.toBeNull()

    const code = await getEmailCode({ email })
    expect(code).not.toBeNull()

    // validating email with code
    const response = await axios({
      url: urlEmailLogin,
      method: "POST",
      data: {
        code,
        flow,
      },
    })

    expect(response.data).toMatchObject({
      result: {
        sessionToken: expect.any(String),
        totpRequired: true,
      },
    })

    const sessionToken = response.data.result.sessionToken

    {
      const { apolloClient, disposeClient } = createApolloClient(
        defaultTestClientConfig(sessionToken),
      )

      // call with this session token should fail until totp is provided
      const emailQueryPromise = apolloClient.query<EmailQuery>({
        query: EmailDocument,
        fetchPolicy: "network-only",
      })

      await expect(emailQueryPromise).rejects.toThrow()
      disposeClient()
    }

    const totpCode = authenticator.generate(totpSecret) as TotpCode
    await elevatingSessionWithTotp({ sessionToken, totpCode })

    // call should now succeed
    {
      const { apolloClient, disposeClient } = createApolloClient(
        defaultTestClientConfig(sessionToken),
      )

      const emailQueryPromise = apolloClient.query<EmailQuery>({
        query: EmailDocument,
        fetchPolicy: "network-only",
      })

      await expect(emailQueryPromise).resolves.toMatchObject({
        data: {
          me: {
            email: {
              address: email,
              verified: true,
            },
            totpEnabled: true,
          },
        },
      })
      disposeClient()
    }
  })

  it("add new phone mutation", async () => {
    const userRef = "N"
    const { phone, code } = getPhoneAndCodeFromRef(userRef)

    const res2 = await apolloClient.mutate<UserPhoneSetMutation>({
      mutation: UserPhoneSetDocument,
      variables: {
        input: {
          phone,
        },
      },
    })

    expect(res2.data?.userPhoneSet.success).toBe(true)

    const res3 = await apolloClient.mutate<UserPhoneVerifyMutation>({
      mutation: UserPhoneVerifyDocument,
      variables: {
        input: {
          phone,
          code,
        },
      },
    })

    expect(res3.data?.userPhoneVerify.errors).toStrictEqual([])
  })
})
