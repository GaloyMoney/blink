import { v4 as uuidv4 } from "uuid"

import { server } from "@/app/api/graphql/route"
import { generateRandomHash } from "@/utils/helpers"

const random_hash = generateRandomHash()
const uuid = uuidv4()
const userId = "aaaaaaa1-e098-4a16-932b-e4f4abc24366"

function getExpectedData(propertyName: string) {
  return expect.objectContaining({
    singleResult: expect.objectContaining({
      data: expect.objectContaining({
        [propertyName]: expect.objectContaining({
          id: uuid,
        }),
      }),
    }),
  })
}

describe("GraphQL API Tests", () => {
  it("returns data as expected for createWithdrawLink mutation", async () => {
    const variables = {
      input: {
        id: uuid,
        paymentHash: random_hash,
        userId: userId,
        paymentRequest: "paymentRequest",
        paymentSecret: "paymentSecret",
        salesAmountInCents: 12,
        accountType: "account",
        escrowWallet: "wallet",
        title: `Galoy withdraw test`,
        voucherAmountInCents: 12,
        uniqueHash: random_hash,
        k1: random_hash,
        commissionPercentage: 12,
      },
    }

    const response = await server.executeOperation({
      query: CREATE_WITHDRAW_LINK,
      variables,
    })
    expect(response.body).toMatchObject(getExpectedData("createWithdrawLink"))
  })

  it("returns data as expected for getWithdrawLink query", async () => {
    const variables = {
      getWithdrawLinkId: uuid,
    }

    const response = await server.executeOperation({
      query: GET_WITHDRAW_LINK,
      variables,
    })

    expect(response.body).toMatchObject(getExpectedData("getWithdrawLink"))
  })

  it("returns data as expected for getWithdrawLinksByUserId query", async () => {
    const variables = {
      userId: userId,
    }

    const response = await server.executeOperation({
      query: GET_WITHDRAW_LINKS_BY_USER_ID,
      variables,
    })

    expect(response.body).toMatchObject(
      expect.objectContaining({
        singleResult: expect.objectContaining({
          data: expect.objectContaining({
            getWithdrawLinksByUserId: expect.objectContaining({
              withdrawLinks: expect.arrayContaining([
                expect.objectContaining({
                  id: uuid,
                }),
              ]),
            }),
          }),
        }),
      }),
    )
  })

  it("returns data as expected for deleteWithdrawLink query", async () => {
    const variables = {
      id: uuid,
    }

    const response = await server.executeOperation({
      query: DELETE_WITHDRAW_LINK,
      variables,
    })

    expect(response.body).toMatchObject(
      expect.objectContaining({
        singleResult: expect.objectContaining({
          data: expect.objectContaining({
            deleteWithdrawLink: uuid,
          }),
        }),
      }),
    )
  })
})
