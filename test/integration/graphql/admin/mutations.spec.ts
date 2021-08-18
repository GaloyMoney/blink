import { graphql } from "graphql"

import { User } from "@services/mongoose/schema"
import { gqlAdminSchema } from "@graphql/admin"
import { AccountsRepository, UsersRepository } from "@services/mongoose"

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
    const { errors, data } = result

    const usersRepo = UsersRepository()
    const updatedUser = await usersRepo.findByUsername("tester" as Username)
    expect(errors).toBeNull
    expect(updatedUser).not.toBeInstanceOf(Error)
    if (updatedUser instanceof Error) throw updatedUser

    const accountsRepo = AccountsRepository()
    const defaultAccount = await accountsRepo.findById(updatedUser.defaultAccountId)
    expect(defaultAccount).not.toBeInstanceOf(Error)
    if (defaultAccount instanceof Error) throw defaultAccount

    expect(defaultAccount.level).toEqual(2)
    expect(data?.userUpdateLevel.userDetails.level).toEqual("TWO")
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
    const { errors, data } = result
    expect(errors).toBeNull

    const usersRepo = UsersRepository()
    const updatedUser = await usersRepo.findByUsername("tester" as Username)
    expect(updatedUser).not.toBeInstanceOf(Error)
    if (updatedUser instanceof Error) throw updatedUser

    const accountsRepo = AccountsRepository()
    const defaultAccount = await accountsRepo.findById(updatedUser.defaultAccountId)
    expect(defaultAccount).not.toBeInstanceOf(Error)
    if (defaultAccount instanceof Error) throw defaultAccount

    expect(data?.userUpdateStatus.userDetails.id).toEqual(updatedUser.id)
    expect(defaultAccount.status).toEqual("locked")
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
    const { errors, data } = result
    expect(errors).toBeNull

    const usersRepo = UsersRepository()
    const updatedUser = await usersRepo.findByUsername("tester" as Username)
    expect(updatedUser).not.toBeInstanceOf(Error)
    if (updatedUser instanceof Error) throw updatedUser

    expect(data?.merchantUpdateMapInfo.userDetails.id).toEqual(updatedUser.id)
    expect(updatedUser.title).toEqual("MapTest")
    expect(updatedUser.coordinate).toEqual({ longitude: 1, latitude: -1 })
  })
})
