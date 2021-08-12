import {
  btc2sat,
  sat2btc,
  amountOnVout,
  myOwnAddressesOnVout,
  isInvoiceAlreadyPaidError,
} from "@core/utils"

describe("utils.ts", () => {
  describe("btc2sat", () => {
    it("converts from BTC to Satoshis", () => {
      expect(btc2sat(0)).toEqual(0)
      expect(btc2sat(1.2)).toEqual(120000000)
      expect(btc2sat(1.1235678)).toEqual(112356780)
      expect(btc2sat(-1.2)).toEqual(-120000000)
      expect(btc2sat(-1.1235678)).toEqual(-112356780)
    })
  })

  describe("sat2btc", () => {
    it("converts from Satoshis to BTC", () => {
      expect(sat2btc(0)).toEqual(0)
      expect(sat2btc(120000000)).toEqual(1.2)
      expect(sat2btc(112356780)).toEqual(1.1235678)
      expect(sat2btc(-120000000)).toEqual(-1.2)
      expect(sat2btc(-112356780)).toEqual(-1.1235678)
    })
  })

  describe("amountOnVout", () => {
    it("returns the amount of the given addresses at index 0 of vout", () => {
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

      const addresses = [
        "bcrt1qv92q9t24ahdm6m7nffdrqw9slj8ycmpd4nu8nx",
        "bcrt1qqmxaqvvhd3d7t36f4lm9qs6gw78y4gsu4g6wq7",
        "bcrt1qa5tm90t3j9cf5a5wffkmzg7xwuj2e6j3pwgmek",
        "bcrt1qq506g7kv02xgah7sl5lf4avkk9mvpzkf099jth",
        "bcrt1qfzyt3xdksme9t8rmpvauesf6rcdtjzur7d3kqd",
      ]

      const amount = amountOnVout({ vout, addresses })
      expect(amount).toBe(1)
    })

    it("returns the amount of the given addresses at index 1 of vout", () => {
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

      const addresses = [
        "bcrt1q8psckhj450a4qs6jy7f4n0rec9h5qp3e4zllve",
        "bcrt1qg5h7khnuvyk3hrmkwhcde7ntdjd4aj63ta4jcr",
        "bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw",
      ]

      const amount = amountOnVout({ vout, addresses })
      expect(amount).toBe(1)
    })

    it("does not fail if there are no addresses in vout", () => {
      const vout = [
        {
          value: 1,
          n: 0,
          scriptPubKey: {
            asm: "0 f3bbce2f4bc8ce783afac6ed9b6d911eba92de45",
            hex: "0014f3bbce2f4bc8ce783afac6ed9b6d911eba92de45",
            reqSigs: 1,
            type: "witness_v0_keyhash",
            addresses: ["bcrt1q7wauut6ter88swh6cmkekmv3r6af9hj9plkn07"],
          },
        },
        {
          value: 0,
          n: 1,
          scriptPubKey: {
            asm: "OP_RETURN aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf9",
            hex: "6a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf9",
            type: "nulldata",
          },
        },
      ]

      const addresses = [
        "bcrt1q8psckhj450a4qs6jy7f4n0rec9h5qp3e4zllve",
        "bcrt1qg5h7khnuvyk3hrmkwhcde7ntdjd4aj63ta4jcr",
        "bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw",
      ]

      let amount = amountOnVout({ vout, addresses })
      expect(amount).toBe(0)

      addresses.push("bcrt1q7wauut6ter88swh6cmkekmv3r6af9hj9plkn07")

      amount = amountOnVout({ vout, addresses })
      expect(amount).toBe(1)
    })
  })

  describe("myOwnAddressesOnVout", () => {
    it("returns the given addresses found in the vout", () => {
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

      const addresses = [
        "bcrt1q8psckhj450a4qs6jy7f4n0rec9h5qp3e4zllve",
        "bcrt1qg5h7khnuvyk3hrmkwhcde7ntdjd4aj63ta4jcr",
        "bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw",
      ]

      const result = myOwnAddressesOnVout({ vout, addresses })
      expect(result).toStrictEqual(["bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw"])
    })

    it("does not fail if there are no addresses in vout", () => {
      const vout = [
        {
          value: 1,
          n: 0,
          scriptPubKey: {
            asm: "0 f3bbce2f4bc8ce783afac6ed9b6d911eba92de45",
            hex: "0014f3bbce2f4bc8ce783afac6ed9b6d911eba92de45",
            reqSigs: 1,
            type: "witness_v0_keyhash",
            addresses: ["bcrt1q7wauut6ter88swh6cmkekmv3r6af9hj9plkn07"],
          },
        },
        {
          value: 0,
          n: 1,
          scriptPubKey: {
            asm: "OP_RETURN aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf9",
            hex: "6a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf9",
            type: "nulldata",
          },
        },
      ]

      const addresses = [
        "bcrt1q8psckhj450a4qs6jy7f4n0rec9h5qp3e4zllve",
        "bcrt1qg5h7khnuvyk3hrmkwhcde7ntdjd4aj63ta4jcr",
        "bcrt1q72nxdjsh0zsdyd0e9zreh9e6npcutcqsqscfvw",
      ]

      let result = myOwnAddressesOnVout({ vout, addresses })
      expect(result).toStrictEqual([])

      addresses.push("bcrt1q7wauut6ter88swh6cmkekmv3r6af9hj9plkn07")

      result = myOwnAddressesOnVout({ vout, addresses })
      expect(result).toStrictEqual(["bcrt1q7wauut6ter88swh6cmkekmv3r6af9hj9plkn07"])
    })
  })

  describe("isInvoiceAlreadyPaidError", () => {
    it("decodes error correctly", () => {
      const error = [
        503,
        "UnexpectedPaymentError",
        {
          err: {
            code: 6,
            details: "invoice is already paid",
            metadata: { internalRepr: {}, options: {} },
          },
        },
      ]
      expect(isInvoiceAlreadyPaidError(error)).toBeTruthy()
    })
  })
})
