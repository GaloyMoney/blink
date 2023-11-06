import { parsePaginationArgs } from "@/domain/pagination"
import { InvalidPaginationArgsError } from "@/domain/pagination/errors"

describe("parsePaginationArgs", () => {
  const maxPageSize = 100

  it("should return max page size when no pagination args are provided", () => {
    const result = parsePaginationArgs({ maxPageSize })
    expect(result).toEqual({ first: maxPageSize, after: undefined, before: undefined })
  })

  it('should return error when both "first" and "last" are provided', () => {
    const result = parsePaginationArgs({
      paginationArgs: { first: 10, last: 10 },
      maxPageSize,
    })
    expect(result).toBeInstanceOf(InvalidPaginationArgsError)
  })

  it('should return error when "first" is greater than max page size', () => {
    const result = parsePaginationArgs({ paginationArgs: { first: 101 }, maxPageSize })
    expect(result).toBeInstanceOf(InvalidPaginationArgsError)
  })

  it('should return error when "first" is less than or equal to 0', () => {
    const result = parsePaginationArgs({ paginationArgs: { first: 0 }, maxPageSize })
    expect(result).toBeInstanceOf(InvalidPaginationArgsError)
  })

  it('should return valid parsed args when "first" is within valid range', () => {
    const first = 50
    const result = parsePaginationArgs({ paginationArgs: { first }, maxPageSize })
    expect(result).toEqual({ first, after: undefined, before: undefined })
  })

  it('should return error when "last" is greater than max page size', () => {
    const result = parsePaginationArgs({ paginationArgs: { last: 101 }, maxPageSize })
    expect(result).toBeInstanceOf(InvalidPaginationArgsError)
  })

  it('should return error when "last" is less than or equal to 0', () => {
    const result = parsePaginationArgs({ paginationArgs: { last: -1 }, maxPageSize })
    expect(result).toBeInstanceOf(InvalidPaginationArgsError)
  })

  it('should return valid parsed args when "last" is within valid range', () => {
    const last = 50
    const result = parsePaginationArgs({ paginationArgs: { last }, maxPageSize })
    expect(result).toEqual({ last, before: undefined, after: undefined })
  })

  it('should handle "after" cursor when provided with "first"', () => {
    const after = "cursor"
    const first = 10
    const result = parsePaginationArgs({ paginationArgs: { after, first }, maxPageSize })
    expect(result).toEqual({ first, after, before: undefined })
  })

  it('should handle "before" cursor when provided with "last"', () => {
    const before = "cursor"
    const last = 10
    const result = parsePaginationArgs({ paginationArgs: { before, last }, maxPageSize })
    expect(result).toEqual({ last, before, after: undefined })
  })
})
