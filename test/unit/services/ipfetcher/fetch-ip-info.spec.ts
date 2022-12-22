import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { IpFetcher } from "@services/ipfetcher"
import { isPrivateIp } from "@domain/accounts-ips"

let mock

beforeAll(() => {
  mock = new MockAdapter(axios)
})

afterEach(() => {
  mock.reset()
})

describe("IpFetcher - fetchIPInfo", () => {
  it("returns proxy false when proxy is no", async () => {
    const ip = "152.231.190.229" as IpAddress
    mock.onGet(new RegExp(`${ip}`)).reply(200, getIpInfo(ip))

    const ipInfo = await IpFetcher().fetchIPInfo(ip)
    expect(ipInfo).toEqual(
      expect.objectContaining({
        proxy: false,
        status: "ok",
      }),
    )
  })

  it("returns proxy true when proxy is yes", async () => {
    const ip = "152.231.190.229" as IpAddress
    const data = getIpInfo(ip)
    data[ip]["proxy"] = "yes"

    mock.onGet(new RegExp(`${ip}`)).reply(200, data)

    const ipInfo = await IpFetcher().fetchIPInfo(ip)
    expect(ipInfo).toEqual(
      expect.objectContaining({
        proxy: true,
        status: "ok",
      }),
    )
  })

  it("returns proxy false when proxy is undefined", async () => {
    const ip = "152.231.190.229" as IpAddress
    const data = getIpInfo(ip)
    delete data[ip]["proxy"]

    mock.onGet(new RegExp(`${ip}`)).reply(200, data)

    const ipInfo = await IpFetcher().fetchIPInfo(ip)
    expect(ipInfo).toEqual(
      expect.objectContaining({
        proxy: false,
        status: "ok",
      }),
    )
  })
})

describe("ipaddr.js", () => {
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

const getIpInfo = (ip: string) => ({
  status: "ok",
  [ip]: {
    asn: "AS52228",
    provider: "Cable Tica",
    organisation: "Cable Tica",
    continent: "North America",
    country: "Costa Rica",
    isoCode: "CR",
    region: "Provincia de San Jose",
    regioncode: "SJ",
    city: "Perez Zeledon",
    latitude: 9.3573,
    longitude: -83.6356,
    proxy: "no",
    type: "Residential",
  },
})
