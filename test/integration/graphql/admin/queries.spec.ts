import { graphql } from "graphql"

import { User } from "@services/mongoose/schema"
import { gqlAdminSchema } from "@graphql/admin"

beforeAll(async () => {
  let user = await User.findOne({ username: "tester", phone: "+19876543210" })
  if (!user) {
    user = await User.create({ username: "tester", phone: "+19876543210" })
  }
})

describe("GraphQLQueryRoot", () => {
  it("exposes allLevels", async () => {
    const query = `
      query Q {
        allLevels
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
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
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result
    expect(errors).toBeUndefined()
    expect(data?.accountDetails.createdAt).toBeDefined()
    expect(data?.accountDetails.owner.phone).toBe(phone)
    expect(data?.accountDetails.owner.defaultAccount.id).toBe(data?.accountDetails.id)
  })

  it("exposes accountDetails by username", async () => {
    const query = `
      query Q {
        accountDetails: accountDetailsByUsername(username: "tester") {
          createdAt
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result
    expect(errors).toBeUndefined()
    expect(data?.accountDetails.createdAt).toBeDefined()
  })
})
