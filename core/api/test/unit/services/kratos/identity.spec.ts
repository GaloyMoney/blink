import { getNextPageToken } from "@/services/kratos"

describe("decoding link header", () => {
  const withNext =
    '</admin/clients?page_size=5&page_token=euKoY1BqY3J8GVax>; rel="first",</admin/clients?page_size=5&page_token=h9LfEKUiFoLH2R0A>; rel="next"'

  const withoutNext =
    '</admin/clients?page_size=5&page_token=euKoY1BqY3J8GVax>; rel="first"'

  it("try decoding link successfully", () => {
    expect(getNextPageToken(withNext)).toBe("h9LfEKUiFoLH2R0A")
  })

  it("should be undefined when no more next is present", () => {
    expect(getNextPageToken(withoutNext)).toBe(undefined)
  })
})
