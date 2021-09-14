import { checkedToTargetConfs } from "@domain/bitcoin"

describe("checkedToTargetConfs", () => {
  it("succeeds if positive", () => {
    const confs = checkedToTargetConfs(3)
    expect(confs).toEqual(3)
  })

  it("fails if zero", () => {
    const confs = checkedToTargetConfs(0)
    expect(confs).toBeInstanceOf(Error)
  })

  it("fails if negative", () => {
    const confs = checkedToTargetConfs(-1)
    expect(confs).toBeInstanceOf(Error)
  })
})
