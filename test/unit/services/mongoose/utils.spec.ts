import { Types } from "mongoose"
import { toObjectId, fromObjectId } from "@services/mongoose/utils"

describe("toObjectId / fromObjectId", () => {
  it("presevers identity", () => {
    const id = new Types.ObjectId()
    const userId = fromObjectId<UserId>(id)
    expect(toObjectId<UserId>(userId)).toEqual(id)
  })

  it("converts to string", () => {
    const id = new Types.ObjectId()
    const userId = fromObjectId<UserId>(id)
    expect(typeof userId).toBe("string")
  })
})
