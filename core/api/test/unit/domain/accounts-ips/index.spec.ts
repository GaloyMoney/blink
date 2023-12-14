import { isPrivateIp } from "@/domain/accounts-ips"

describe("isPrivateIp", () => {
  it("check ipv6 private address validation", () => {
    const localhost = "::ffff:127.0.0.1"
    expect(isPrivateIp(localhost)).toBeTruthy()
  })

  it("check ipv4 localhost address validation", () => {
    const localhost = "127.0.0.1"
    expect(isPrivateIp(localhost)).toBeTruthy()
  })

  it("check ipv4 private address validation", () => {
    const localhost = "192.168.1.1"
    expect(isPrivateIp(localhost)).toBeTruthy()
  })

  it("check non private IP", () => {
    const localhost = "152.231.190.229"
    expect(isPrivateIp(localhost)).toBeFalsy()
  })
})
