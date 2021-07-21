import { graphql } from "graphql"

import { User } from "src/schema"
import { gqlAdminSchema } from "src/graphql/admin"

let user

beforeAll(async () => {
  user = await User.findOrCreate({ username: "tester", phone: "+19876543210" })
})

describe("GraphQLMutationRoot", () => {
  it("exposes userUpdateLevel", async () => {
    const query = `
      mutation {
        userUpdateLevel(input: { uid: "${user.id}", level: TWO}) {
          errors {
            message
            fields
          }
          userDetails {
            id
            username
            phone
            level
            createdAt
          }
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { data } = result

    if (!data) {
      throw new Error("invalid response")
    }
    const updatedUser = await User.getUser({ username: "tester" })

    expect(updatedUser.level).toEqual(2)
    expect(data.userUpdateLevel.userDetails.level).toEqual("TWO")
  })

  it("exposes userUpdateStatus", async () => {
    const query = `
      mutation {
        userUpdateStatus(input: { uid: "${user.id}", status: LOCKED}) {
          errors {
            message
            fields
          }
          userDetails {
            id
            username
            phone
            level
            createdAt
          }
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { data } = result

    if (!data) {
      throw Error("invalid response")
    }

    const updatedUser = await User.getUser({ username: "tester" })

    expect(updatedUser.status).toEqual("locked")
    expect(data.userUpdateStatus.userDetails.id).toEqual(updatedUser.id)
  })

  it("exposes merchantUpdateMapInfo", async () => {
    const query = `
      mutation {
        merchantUpdateMapInfo(input: { username: "${user.username}", title: "MapTest", longitude: 1, latitude: -1 }) {
          errors {
            message
            fields
          }
          userDetails {
            id
            username
            phone
            level
            createdAt
          }
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { data } = result

    if (!data) {
      throw Error("invalid response")
    }

    const updatedUser = await User.getUser({ username: "tester" })

    expect(updatedUser.title).toEqual("MapTest")
    expect(updatedUser.coordinate).toEqual({ longitude: 1, latitude: -1 })
    expect(data.merchantUpdateMapInfo.userDetails.id).toEqual(updatedUser.id)
  })
})
