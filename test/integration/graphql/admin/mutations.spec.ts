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
    const mutation = `
      mutation {
        userUpdateLevel(input: { uid: "${user.id}", level: TWO}) {
          errors {
            message
          }
          userDetails {
            id
            level
            createdAt
          }
        }
      }
    `

    {
      const { errors, data } = await graphql(gqlAdminSchema, mutation, {})
      expect(errors).toBeUndefined()
      expect(data?.userUpdateLevel.userDetails.level).toEqual("TWO")
    }

    const query = `
    query {
      userDetailsByUsername(username: "tester") {
        level
      }
    }
    `

    {
      const { errors, data } = await graphql(gqlAdminSchema, query, {})
      expect(errors).toBeUndefined()
      console.log({ data })
      expect(data?.userDetailsByUsername.level).toEqual("TWO")
    }
  })

  it("exposes userUpdateStatus", async () => {
    const mutation = `
      mutation {
        userUpdateStatus(input: { uid: "${user.id}", status: LOCKED}) {
          errors {
            message
          }
          userDetails {
            id
            level
            createdAt
          }
        }
      }
    `
    const result = await graphql(gqlAdminSchema, mutation, {})
    const { data: dataMutation, errors } = result
    expect(errors).toBeUndefined()

    const query = `
    query {
      userDetailsByUsername(username: "tester") {
        id
        status
      }
    }
    `

    {
      const { errors, data } = await graphql(gqlAdminSchema, query, {})
      expect(errors).toBeUndefined()
      expect(data?.userDetailsByUsername.id).toEqual(
        dataMutation?.userUpdateStatus.userDetails.id,
      )
      expect(data?.userDetailsByUsername.status).toEqual("LOCKED")
    }
  })

  it("exposes businessUpdateMapInfo", async () => {
    const mutation = `
      mutation {
        businessUpdateMapInfo(input: { username: "${user.username}", title: "MapTest", longitude: 1, latitude: -1 }) {
          errors {
            message
          }
          userDetails {
            id
            level
            status
            title
            coordinates {
              latitude
              longitude
            }
            createdAt
          }
        }
      }
    `

    const result = await graphql(gqlAdminSchema, mutation, {})
    const { errors: errorsMutation, data: dataMutation } = result
    expect(errorsMutation).toBeUndefined()

    const query = `
    query {
      userDetailsByUsername(username: "tester") {
        id
        title
        coordinates {
          latitude
          longitude
        }
      }
    }
    `

    const { errors, data } = await graphql(gqlAdminSchema, query, {})
    expect(errors).toBeUndefined()

    expect(dataMutation?.businessUpdateMapInfo.userDetails.id).toEqual(
      data?.userDetailsByUsername.id,
    )
    expect(data?.userDetailsByUsername.title).toEqual("MapTest")
    expect(data?.userDetailsByUsername.coordinates).toEqual({
      longitude: 1,
      latitude: -1,
    })
  })
})
