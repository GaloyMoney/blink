import { graphql } from "graphql"

import { User } from "src/schema"
import { gqlAdminSchema } from "src/graphql/admin"

beforeAll(async () => {
  const user = new User({ username: "tester", phone: "+19876543210" })
  await user.save()
})

afterAll(async () => {
  await User.deleteOne({ username: "tester", phone: "+19876543210" })
})

describe("GraphQLQueryRoot", () => {
  it("exposes allLevels", async () => {
    const query = `
      query Q {
        allLevels
      }
    `
    const rootValue = {}
    const result = await graphql(gqlAdminSchema, query, rootValue)
    const { data } = result

    if (!data) {
      throw Error("invalid response")
    }

    expect(data.allLevels).toEqual(["ONE", "TWO"])
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

    const rootValue = {}
    const result = await graphql(gqlAdminSchema, query, rootValue)
    const { data } = result

    if (!data) {
      throw Error("invalid response")
    }

    expect(data.userDetails.username).toEqual("tester")
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

    const rootValue = {}
    const result = await graphql(gqlAdminSchema, query, rootValue)
    const { data } = result

    if (!data) {
      throw Error("invalid response")
    }

    expect(data.userDetails.phone).toEqual("+19876543210")
  })
})
