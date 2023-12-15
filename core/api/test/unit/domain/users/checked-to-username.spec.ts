import { checkedToUsername } from "@/domain/accounts"

describe("username-check", () => {
  it("Passes alphanumeric username", () => {
    const username = checkedToUsername("alice_12")
    expect(username).toEqual("alice_12")
  })

  it("Fails legacy address", () => {
    const username = checkedToUsername("1LKvxGL8ejTsgBjRVUNCGi7adiwaVnM9cn")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails if starting with 1", () => {
    const username = checkedToUsername("1ab")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails wrapped segwit address", () => {
    const username = checkedToUsername("32ksNi7zSt3t2aesvoEWhGMUEwCFg9UCCG")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails if starting with 3", () => {
    const username = checkedToUsername("3basd")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails segwit address", () => {
    const username = checkedToUsername("bc1qpl8ehyzu44yhwu92w892uxwxdfp9dhu3d0zj2g")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails if starting with bc1", () => {
    const username = checkedToUsername("bc1be")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails lightning payment request", () => {
    const username = checkedToUsername(
      "lnbc1500n1ps36h3rpp5qtgvy47pu6n3t2ggf47vahl3kdjql0d68egtaschvd34atvu5eysdpa2fjkzep6ypyx7aeqw3hjqct4w3hk6ct5d93kzmrv0ys82uryv96x2greda6hycqzpgxqr23ssp5makumjtdy54vz80ayytgld7420uuw5m6pdtq5x2n38gg7z5gd9ms9qyyssq64faagqrfa6qp45jsx8enwgs62fquqfejxk0gmtuf67z7v7d9364c5tw679cd635nmllfwzur348whvrgnf94sx6w40n6ttwa4x8grcqa0ms0d",
    )
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails if starting with lnbc1", () => {
    const username = checkedToUsername("lnbc1qwe1")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails non-underscore special characters", () => {
    const username = checkedToUsername("alice-12")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails if length is less than 3", () => {
    const username = checkedToUsername("ab")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails if contains invalid characters", () => {
    const username = checkedToUsername("ab+/")
    expect(username).toBeInstanceOf(Error)
  })

  it("Fails if non english characters", () => {
    const username = checkedToUsername("ñ_user1")
    expect(username).toBeInstanceOf(Error)
  })
})
