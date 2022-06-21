import { BtcNetwork } from "@domain/bitcoin"
import { checkedToOnChainAddress } from "@domain/bitcoin/onchain"
import { InvalidOnChainAddress } from "@domain/errors"

const addresses = [
  { network: "mainnet", address: "17sELMebjQNf1k1CRucF67QAtegNsTjXUn" },
  { network: "mainnet", address: "3QcAYUrGoKv8tqg24VRB8TDUejmumLG8rL" },
  { network: "mainnet", address: "bc1q40aetdah8wcrsxvzl5qcft4svx696xsw0tnchd" },
  {
    network: "mainnet",
    address: "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcxswfvpysxf3qccfmv3",
  },
  { network: "testnet", address: "mipcBbFg9gLiKh81Kj8taadgoZiY1ZJRfn" },
  { network: "testnet", address: "tb1qw508d6qejxtdg4y5r3aadgory0c5xw7kxpjzsx" },
  {
    network: "testnet",
    address: "tb1p84x2taadgovgnlpnxt9f39gm7r68gwtvllxqe5w2n5ru00s9aquslzggwq",
  },
  { network: "testnet", address: "mipcBbFg9gLiKh81Kj8taadgoZiY1ZJRfn" },
  { network: "testnet", address: "tb1qw508d6qejxtdg4y5r3aadgory0c5xw7kxpjzsx" },
  {
    network: "testnet",
    address: "tb1p84x2taadgovgnlpnxt9f39gm7r68gwtvllxqe5w2n5ru00s9aquslzggwq",
  },
  { network: "signet", address: "mipcBbFg9gLiKh81Kj8taadgoZiY1ZJRfn" },
  { network: "signet", address: "tb1qw508d6qejxtdg4y5r3aadgory0c5xw7kxpjzsx" },
  {
    network: "signet",
    address: "tb1p84x2taadgovgnlpnxt9f39gm7r68gwtvllxqe5w2n5ru00s9aquslzggwq",
  },
  { network: "signet", address: "mipcBbFg9gLiKh81Kj8taadgoZiY1ZJRfn" },
  { network: "signet", address: "tb1qw508d6qejxtdg4y5r3aadgory0c5xw7kxpjzsx" },
  {
    network: "signet",
    address: "tb1p84x2taadgovgnlpnxt9f39gm7r68gwtvllxqe5w2n5ru00s9aquslzggwq",
  },
  { network: "regtest", address: "bcrt1q6z64a43mjgkcq0ul2zaqusq3spghrlau9slefp" },
  {
    network: "regtest",
    address: "bcrt1q5n2k3frgpxces3aqusqfpqk4kksv0cz96pldxdwxrrw0d5ud5haqusx7zt",
  },
]

describe("checkedToOnChainAddress", () => {
  test.each(addresses)("$address is valid for $network", ({ network, address }) => {
    const result = checkedToOnChainAddress({
      network: network as BtcNetwork,
      value: address,
    })
    expect(result).not.toBeInstanceOf(InvalidOnChainAddress)
    expect(result).toBe(address)
  })

  test.each(addresses)(
    "$address is invalid for other networks",
    ({ network, address }) => {
      let networksToCheck: Array<BtcNetwork> = [
        BtcNetwork.testnet,
        BtcNetwork.signet,
        BtcNetwork.regtest,
      ]
      if (network === "testnet")
        networksToCheck = [BtcNetwork.mainnet, BtcNetwork.regtest]
      if (network === "signet") networksToCheck = [BtcNetwork.mainnet, BtcNetwork.regtest]
      if (network === "regtest")
        networksToCheck = [BtcNetwork.mainnet, BtcNetwork.testnet]

      for (const wrongNetwork of networksToCheck) {
        const result = checkedToOnChainAddress({ network: wrongNetwork, value: address })
        expect(result).toBeInstanceOf(InvalidOnChainAddress)
      }
    },
  )
})
