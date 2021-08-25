import { graphql } from "graphql"

import { User } from "@services/mongoose/schema"
import { gqlAdminSchema } from "@graphql/admin"

let user

beforeAll(async () => {
  user = await User.findOne({ username: "tester", phone: "+19876543210" })
  if (!user) {
    user = await User.create({ username: "tester", phone: "+19876543210" })
  }
})

describe("GraphQLMutationRoot", () => {
  it("exposes userUpdateLevel", async () => {
    const query = `
      mutation {
        userUpdateLevel(input: { uid: "${user.id}", level: TWO}) {
          errors {
            message
          }
          userDetails {
            id
            phone
            level
            createdAt
          }
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result

    const updatedUser = await User.getUserByUsername("tester")
    expect(errors).toBeUndefined()
    expect(updatedUser.level).toEqual(2)
    expect(data?.userUpdateLevel.userDetails.level).toEqual("TWO")
  })

  it("exposes userUpdateStatus", async () => {
    const query = `
      mutation {
        userUpdateStatus(input: { uid: "${user.id}", status: LOCKED}) {
          errors {
            message
          }
          userDetails {
            id
            phone
            level
            createdAt
          }
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result
    const updatedUser = await User.getUserByUsername("tester")
    expect(errors).toBeUndefined()
    expect(data?.userUpdateStatus.userDetails.id).toEqual(updatedUser.id)
    expect(updatedUser.status).toEqual("locked")
  })

  it("exposes businessUpdateMapInfo", async () => {
    const query = `
      mutation {
        businessUpdateMapInfo(input: { walletName: "${user.username}", title: "MapTest", longitude: 1, latitude: -1 }) {
          errors {
            message
          }
          userDetails {
            id
            phone
            level
            createdAt
          }
        }
      }
    `
    const result = await graphql(gqlAdminSchema, query, {})
    const { errors, data } = result
    const updatedUser = await User.getUserByUsername("tester")
    expect(errors).toBeUndefined()
    expect(data?.businessUpdateMapInfo.userDetails.id).toEqual(updatedUser.id)
    expect(updatedUser.title).toEqual("MapTest")
    expect(updatedUser.coordinate).toEqual({ longitude: 1, latitude: -1 })
  })
})
