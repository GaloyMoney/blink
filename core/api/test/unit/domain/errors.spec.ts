import { ValidationError } from "@/domain/shared"

import {
  CouldNotFindError,
  RepositoryError,
  UnknownRepositoryError,
  InvalidSatoshiAmountError,
  InvalidWalletId,
} from "@/domain/errors"

describe("errors.ts", () => {
  it("validate that repository errors are valid errors", () => {
    let error = new RepositoryError()
    expect(error instanceof Error).toBe(true)

    error = new UnknownRepositoryError()
    expect(error instanceof RepositoryError).toBe(true)
    expect(error instanceof Error).toBe(true)

    error = new CouldNotFindError()
    expect(error instanceof RepositoryError).toBe(true)
    expect(error instanceof Error).toBe(true)
  })

  it("validate that validation errors are valid errors", () => {
    let error = new ValidationError()
    expect(error instanceof Error).toBe(true)

    error = new InvalidSatoshiAmountError()
    expect(error instanceof ValidationError).toBe(true)
    expect(error instanceof Error).toBe(true)

    error = new InvalidWalletId()
    expect(error instanceof ValidationError).toBe(true)
    expect(error instanceof Error).toBe(true)
  })
})
