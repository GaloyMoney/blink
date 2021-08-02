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

  it("exposes userDetails by phone", async () => {
    const query = `
      query Q {
        userDetails: userDetailsByPhone(phone: "+19876543210") {
          username
          createdAt
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result
    expect(errors).toBeNull
    expect(data?.userDetails.username).toEqual("tester")
  })

  it("exposes userDetails by username", async () => {
    const query = `
      query Q {
        userDetails: userDetailsByUsername(username: "tester") {
          phone
          createdAt
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result
    expect(errors).toBeNull
    expect(data?.userDetails.phone).toEqual("+19876543210")
  })
})
