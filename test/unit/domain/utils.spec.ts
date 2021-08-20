import {
  CouldNotFindError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { isRepoError } from "@domain/utils"

describe("utils.ts", () => {
  describe("isRepoError", () => {
    it("returns true if error is a valid repository error", () => {
      let error = new RepositoryError()
      expect(isRepoError(error)).toBe(true)

      error = new UnknownRepositoryError()
      expect(isRepoError(error)).toBe(true)
    })

    it("returns false if error is not a repo error", () => {
      let error = new CouldNotFindError()
      expect(isRepoError(error)).toBe(false)

      error = new Error()
      expect(isRepoError(error)).toBe(false)
      expect(isRepoError(null)).toBe(false)
    })
  })
})
