import { User } from "@services/mongoose/schema"

import { graphqlAdmin } from "test/helpers"

let user: UserRecord

// TODO?: use generated types

type AccountUpdateLevelMutation = GraphQLResult<{
  accountUpdateLevel: {
    errors: IError[]
    accountDetails: {
      id?: string
      level?: string
      createdAt?: string
      username?: string
    }
  }
}>

type AccountDetailsByUsernameQuery = GraphQLResult<{
  accountDetailsByUsername: {
    id?: string
    level?: string
    status?: string
    title?: string
    coordinates?: {
      latitude?: number
      longitude?: number
    }
  }
}>

type AccountUpdateStatusMutation = GraphQLResult<{
  accountUpdateStatus: {
    errors: IError[]
    accountDetails: {
      id?: string
      level?: string
      createdAt?: string
    }
  }
}>

type BusinessUpdateMapInfoQuery = GraphQLResult<{
  businessUpdateMapInfo: {
    errors: IError[]
    accountDetails: {
      id?: string
      level?: string
      status?: string
      title?: string
      coordinates?: {
        latitude?: number
        longitude?: number
      }
      createdAt?: string
    }
  }
}>

beforeAll(async () => {
  const user_ = await User.findOne({ username: "tester", phone: "+19876543210" })
  if (!user_) {
    user = await User.create({ username: "tester", phone: "+19876543210" })
  } else {
    user = user_
  }
})

describe("GraphQLMutationRoot", () => {
  it("exposes accountUpdateLevel", async () => {
    const mutation = `
      mutation {
        accountUpdateLevel(input: { uid: "${user._id}", level: TWO}) {
          errors {
            message
          }
          accountDetails {
            id
            level
            createdAt
            username
          }
        }
      }
    `

    let username
    {
      const { errors, data } = await graphqlAdmin<AccountUpdateLevelMutation>({
        source: mutation,
      })
      expect(errors).toBeUndefined()
      expect(data?.accountUpdateLevel.accountDetails.level).toEqual("TWO")
      username = data?.accountUpdateLevel.accountDetails.username
    }

    const query = `
      query {
        accountDetailsByUsername(username: "${username}") {
          level
        }
      }
    `

    {
      const { errors, data } = await graphqlAdmin<AccountDetailsByUsernameQuery>({
        source: query,
      })
      expect(errors).toBeUndefined()
      expect(data?.accountDetailsByUsername.level).toEqual("TWO")
    }
  })

  it("exposes accountUpdateStatus", async () => {
    const mutation = `
      mutation {
        accountUpdateStatus(input: { uid: "${user._id}", status: LOCKED}) {
          errors {
            message
          }
          accountDetails {
            id
            level
            createdAt
          }
        }
      }
    `

    const result = await graphqlAdmin<AccountUpdateStatusMutation>({
      source: mutation,
      contextValue: { domainUser: { id: user._id } },
    })
    const { data: dataMutation, errors } = result

    expect(errors).toBeUndefined()

    const query = `
      query {
        accountDetailsByUsername(username: "tester") {
          id
          status
        }
      }
    `

    {
      const { errors, data } = await graphqlAdmin<AccountDetailsByUsernameQuery>({
        source: query,
      })
      expect(errors).toBeUndefined()
      expect(data?.accountDetailsByUsername.id).toEqual(
        dataMutation?.accountUpdateStatus.accountDetails.id,
      )
      expect(data?.accountDetailsByUsername.status).toEqual("LOCKED")
    }
  })

  it("exposes businessUpdateMapInfo", async () => {
    const mutation = `
      mutation {
        businessUpdateMapInfo(input: { username: "${user.username}", title: "MapTest", longitude: 1, latitude: -1 }) {
          errors {
            message
          }
          accountDetails {
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

    const result = await graphqlAdmin<BusinessUpdateMapInfoQuery>({ source: mutation })
    const { errors: errorsMutation, data: dataMutation } = result
    expect(errorsMutation).toBeUndefined()

    const query = `
      query {
        accountDetailsByUsername(username: "tester") {
          id
          title
          coordinates {
            latitude
            longitude
          }
        }
      }
    `

    const { errors, data } = await graphqlAdmin<AccountDetailsByUsernameQuery>({
      source: query,
    })
    expect(errors).toBeUndefined()

    expect(dataMutation?.businessUpdateMapInfo.accountDetails.id).toEqual(
      data?.accountDetailsByUsername.id,
    )
    expect(data?.accountDetailsByUsername.title).toEqual("MapTest")
    expect(data?.accountDetailsByUsername.coordinates).toEqual({
      longitude: 1,
      latitude: -1,
    })
  })
})
