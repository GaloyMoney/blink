import { Types } from "mongoose"

export const toObjectId = <T extends string>(id: T): Types.ObjectId => {
  return new Types.ObjectId(id)
}

export const fromObjectId = <T extends string>(id: Types.ObjectId | string): T => {
  return String(id) as T
}
