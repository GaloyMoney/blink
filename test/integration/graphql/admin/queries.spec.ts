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
    const query = `
      query Q {
        accountDetails: accountDetailsByUserPhone(phone: "+19876543210") {
          createdAt
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result
    expect(errors).toBeUndefined()
    expect(data?.accountDetails.createdAt).toBeDefined()
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
