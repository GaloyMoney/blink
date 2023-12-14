import { parseIps } from "@/domain/accounts-ips"

describe("parseIps", () => {
  it("returns undefined if ip is empty", () => {
    let ip = parseIps(undefined)
    expect(ip).toBe(undefined)

    ip = parseIps("")
    expect(ip).toBe(undefined)

    ip = parseIps([])
    expect(ip).toBe(undefined)

    ip = parseIps([""])
    expect(ip).toBe(undefined)

    ip = parseIps(", 192.168.0.2")
    expect(ip).toBe(undefined)
  })

  it("returns first ip from array", () => {
    const ip = parseIps(["192.168.0.1", "192.168.0.2"])
    expect(ip).toBe("192.168.0.1")
  })

  it("returns first ip from string array", () => {
    let ip = parseIps("192.168.0.1, 192.168.0.2")
    expect(ip).toBe("192.168.0.1")

    ip = parseIps("192.168.0.1 , 192.168.0.2")
    expect(ip).toBe("192.168.0.1")

    ip = parseIps(" 192.168.0.2, 192.168.0.3")
    expect(ip).toBe("192.168.0.2")
  })
})
