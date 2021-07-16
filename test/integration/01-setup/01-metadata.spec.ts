import { DbMetadata } from "src/schema"

describe("DbMetadata", () => {
  it("sets min version for graphql", async () => {
    await DbMetadata.create({ minBuildNumber: 200, lastBuildNumber: 200 })
  })
})
