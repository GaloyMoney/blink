import {
  randomApiKey,
  hashApiKey,
  InvalidApiKeyError,
  InvalidExpirationError,
} from "@domain/accounts"

const delta = 30 // days
const expireAt = new Date(Date.now())
expireAt.setDate(expireAt.getDate() + delta)

const isValidEncoding = (str: string, encoding: BufferEncoding) =>
  str === Buffer.from(str, encoding).toString(encoding)

const hash = async (apiKey: ApiKey): Promise<HashedKey> => {
  const hashedKey = await hashApiKey(apiKey)
  if (hashedKey instanceof Error) throw hashedKey
  return hashedKey
}

const addApiKeyForAccount = async (): Promise<ApiKey> => {
  const apikey = await randomApiKey(expireAt)
  if (apikey instanceof Error) throw apikey
  return apikey
}

describe("randomApiKey", () => {
  it("creates a valid api key/secret", async () => {
    const apikey = await addApiKeyForAccount()
    expect(isValidEncoding(apikey.key, "hex")).toBe(true)
    expect(isValidEncoding(apikey.secret, "base64")).toBe(true)
  })

  it("fails if expired", async () => {
    const expireAt = new Date(Date.now() - 1)
    const apikey = await randomApiKey(expireAt)
    expect(apikey).toBeInstanceOf(InvalidExpirationError)
  })
})

describe("hashApiKey", () => {
  it("returns a hashed key", async () => {
    const apikey = await addApiKeyForAccount()
    const hashedKey = await hash(apikey)
    const hashedKey2 = await hash(apikey)

    expect(isValidEncoding(hashedKey, "base64")).toBe(true)
    expect(hashedKey).toBe(hashedKey2)
  })

  it("fails if empty apikey", async () => {
    const apikey = {} as ApiKey
    const hashedKey = await hashApiKey(apikey)
    expect(hashedKey).toBeInstanceOf(InvalidApiKeyError)
  })

  it("fails if empty key", async () => {
    let hashedKey = await hashApiKey({ key: "", secret: "abc" })
    expect(hashedKey).toBeInstanceOf(InvalidApiKeyError)

    hashedKey = await hashApiKey({ secret: "abc" } as ApiKey)
    expect(hashedKey).toBeInstanceOf(InvalidApiKeyError)
  })

  it("fails if empty secret", async () => {
    let hashedKey = await hashApiKey({ key: "abc", secret: "" })
    expect(hashedKey).toBeInstanceOf(InvalidApiKeyError)

    hashedKey = await hashApiKey({ key: "abc" } as ApiKey)
    expect(hashedKey).toBeInstanceOf(InvalidApiKeyError)
  })
})
