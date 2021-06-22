import { amountOnVout, myOwnAddressesOnVout } from "../utils"

// ie: could we have multiple addresses in a vout?
it("filter0", async () => {
  const vout = [
    {
      value: 1,
      n: 0,
      scriptPubKey: {
        asm: "0 4888b899b686f2559c7b0b3bccc13a1e1ab90b83",
        hex: "00144888b899b686f2559c7b0b3bccc13a1e1ab90b83",
        reqSigs: 1,
        type: "witness_v0_keyhash",
        addresses: ["bcrt1qfzyt3xdksme9t8rmpvauesf6rcdtjzur7d3kqd"],
      },
    },
    {
      value: 40.9997918,
      n: 1,
      scriptPubKey: {
        asm: "0 874a771a7b3d65f010ab8037fb527c6086901ecd",
        hex: "0014874a771a7b3d65f010ab8037fb527c6086901ecd",
        reqSigs: 1,
        type: "witness_v0_keyhash",
        addresses: ["bcrt1qsa98wxnm84jlqy9tsqmlk5nuvzrfq8kdpfqf5y"],
      },
    },
  ]

  const onchain_addresses = [
    "bcrt1qv92q9t24ahdm6m7nffdrqw9slj8ycmpd4nu8nx",
    "bcrt1qqmxaqvvhd3d7t36f4lm9qs6gw78y4gsu4g6wq7",
    "bcrt1qa5tm90t3j9cf5a5wffkmzg7xwuj2e6j3pwgmek",
    "bcrt1qq506g7kv02xgah7sl5lf4avkk9mvpzkf099jth",
    "bcrt1qfzyt3xdksme9t8rmpvauesf6rcdtjzur7d3kqd",
  ]

  const f = amountOnVout({ vout, onchain_addresses })
  expect(f).toBe(1)
})

it("filter1", async () => {
  const onchain_addresses = [
    "bcrt1q8psckhj450a4qs6jy7f4n0rec9h5qp3e4zllve",
    "bcrt1qg5h7khnuvyk3hrmkwhcde7ntdjd4aj63ta4jcr",
    "bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw",
  ]

  const vout = [
    {
      value: 45.9998826,
      n: 0,
      scriptPubKey: {
        asm: "0 fa5456eb34b5eb6aab19e8254f06acd086aeee08",
        hex: "0014fa5456eb34b5eb6aab19e8254f06acd086aeee08",
        reqSigs: 1,
        type: "witness_v0_keyhash",
        addresses: ["bcrt1qlf29d6e5kh4k42ceaqj57p4v6zr2amsg6f0gk2"],
      },
    },
    {
      value: 1,
      n: 1,
      scriptPubKey: {
        asm: "0 f2a666ca1778a0d235f928879b973a9871c5e010",
        hex: "0014f2a666ca1778a0d235f928879b973a9871c5e010",
        reqSigs: 1,
        type: "witness_v0_keyhash",
        addresses: ["bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw"],
      },
    },
  ]

  const f = amountOnVout({ vout, onchain_addresses })
  expect(f).toBe(1)
})

it("filter address", async () => {
  const onchain_addresses = [
    "bcrt1q8psckhj450a4qs6jy7f4n0rec9h5qp3e4zllve",
    "bcrt1qg5h7khnuvyk3hrmkwhcde7ntdjd4aj63ta4jcr",
    "bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw",
  ]

  const vout = [
    {
      value: 45.9998826,
      n: 0,
      scriptPubKey: {
        asm: "0 fa5456eb34b5eb6aab19e8254f06acd086aeee08",
        hex: "0014fa5456eb34b5eb6aab19e8254f06acd086aeee08",
        reqSigs: 1,
        type: "witness_v0_keyhash",
        addresses: ["bcrt1qlf29d6e5kh4k42ceaqj57p4v6zr2amsg6f0gk2"],
      },
    },
    {
      value: 1,
      n: 1,
      scriptPubKey: {
        asm: "0 f2a666ca1778a0d235f928879b973a9871c5e010",
        hex: "0014f2a666ca1778a0d235f928879b973a9871c5e010",
        reqSigs: 1,
        type: "witness_v0_keyhash",
        addresses: ["bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw"],
      },
    },
  ]

  const addresses = myOwnAddressesOnVout({ vout, onchain_addresses })
  expect(addresses).toStrictEqual(["bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw"])
})
