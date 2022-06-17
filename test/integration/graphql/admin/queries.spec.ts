import { createUserAndWalletFromUserRef, graphqlAdmin } from "test/helpers"

// TODO?: use generated types

type AllLevelsQuery = GraphQLResult<{
  allLevels?: string[]
}>

type AccountDetailsQuery = GraphQLResult<{
  accountDetails: {
    id?: string
    username?: string
    level?: string
    wallets?: Wallet[]
    status?: string
    title?: string
    owner?: {
      id?: string
      phone?: string
      language?: string
      defaultAccount?: {
        id?: string
      }
      createdAt?: string
    }
    coordinates?: {
      latitude?: string
      longitude?: string
    }
    createdAt?: string
  }
}>

beforeAll(async () => {
  await createUserAndWalletFromUserRef("H")
})

describe("GraphQLQueryRoot", () => {
  it("exposes allLevels", async () => {
    const query = `
      query Q {
        allLevels
      }
    `
    const result = await graphqlAdmin<AllLevelsQuery>({ source: query })
    const { data } = result
    expect(data?.allLevels).toEqual(["ONE", "TWO"])
  })

  it("exposes accountDetails by phone", async () => {
    const phone = "+19876543210"
    const query = `
      query Q {
        accountDetails: accountDetailsByUserPhone(phone: "${phone}") {
          id
          username
          level
          status
          wallets {
            id
            walletCurrency
          }
          title
          owner {
            id
            phone
            language
            defaultAccount {
              id
            }
            createdAt
          }
          coordinates {
            latitude
            longitude
          }
          createdAt
        }
      }
    `
    const result = await graphqlAdmin<AccountDetailsQuery>({ source: query })
    const { errors, data } = result
    expect(errors).toBeUndefined()
    expect(data?.accountDetails.createdAt).toBeDefined()
    expect(data?.accountDetails?.owner?.phone).toBe(phone)
    expect(data?.accountDetails?.owner?.defaultAccount?.id).toBe(data?.accountDetails.id)
    expect(data?.accountDetails?.wallets).toEqual(
      expect.objectContaining([
        expect.objectContaining({
          id: expect.any(String),
          walletCurrency: expect.any(String),
        }),
      ]),
    )
  })

  it("exposes accountDetails by username", async () => {
    const query = `
      query Q {
        accountDetails: accountDetailsByUsername(username: "tester") {
          createdAt
        }
      }
    `
    const result = await graphqlAdmin<AccountDetailsQuery>({ source: query })
    const { errors, data } = result
    expect(errors).toBeUndefined()
    expect(data?.accountDetails.createdAt).toBeDefined()
  })
})
