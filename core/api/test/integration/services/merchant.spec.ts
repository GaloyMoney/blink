import { MerchantsRepository } from "@/services/mongoose"

const merchants = MerchantsRepository()
describe("MerchantsRepository", () => {
  const randomUsername = Math.random().toString(36).substring(7) as Username
  const coordinates = { longitude: 1, latitude: 2 } as Coordinates
  const title = "super shop" as BusinessMapTitle
  const validated = true

  it("add a merchant to the map", async () => {
    const username = randomUsername

    const merchant = await merchants.create({ username, coordinates, title, validated })

    expect(merchant).toMatchObject({
      username,
      coordinates,
      title,
    })

    const location = await merchants.findByUsername(username)
    expect(location).toMatchObject([
      {
        username,
        coordinates,
        title,
        validated,
      },
    ])
  })

  it("a merchant can have multiple username", async () => {
    const username = randomUsername

    const coordinates2 = { longitude: 1.2, latitude: 2.4 } as Coordinates
    const title2 = "super shop second location" as BusinessMapTitle

    const merchant = await merchants.create({
      username,
      coordinates: coordinates2,
      title: title2,
      validated,
    })

    expect(merchant).toMatchObject({
      username,
      coordinates: coordinates2,
      title: title2,
    })

    const location = await merchants.findByUsername(username)
    expect(location).toMatchObject([
      {
        username,
        coordinates,
        title,
        validated,
        id: expect.any(String),
      },
      {
        username,
        title: title2,
        coordinates: coordinates2,
        validated,
        id: expect.any(String),
      },
    ])
  })
})
