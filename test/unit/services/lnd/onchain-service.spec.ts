import { toSats } from "@domain/bitcoin"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { extractIncomingTransactions } from "@services/lnd/onchain-service"

jest.mock("@config/app.ts", () => {
  const config = jest.requireActual("@config/app.ts")
  config.yamlConfig.lnds = []
  return config
})

describe("extractIncomingTransactions", () => {
  const validTxHex =
    "0100000001bcc1db7faba3226e49bf4b78c70433a5afa0b0c88b2f546d0eee07b40bdf70bc010000006a4730440220378952a9acd4fc40dfafba799be975f545793cc679a01c0d552dbb3e4c29556402205b50a6c5b9a541de3cde7519cbb5a8ebfa1bc49488be1ccf898f888ee5105691012102195646c22ab419c14599106960cc8587266cc0ad2189861c44c5eb3dfa771d3cffffffff0260b10a00000000001976a9145ace538e7c29931c5645e233d327af544dfcfa2f88ac1ef6ee19000000001976a9147452552d6ca38bbfc20f3d95dd3dbb4849a33f7d88ac00000000"
  const created_at = "2000-01-01T00:00:00.000Z"
  const decoder = TxDecoder("mainnet" as BtcNetwork)
  it("only returns incoming transactions", () => {
    const txs = extractIncomingTransactions(decoder, {
      transactions: [
        {
          id: "outgoing",
          is_outgoing: true,
          transaction: validTxHex,
          fee: toSats(1),
          created_at,
          is_confirmed: false,
          output_addresses: ["address1"],
          tokens: toSats(1000),
        },
        {
          id: "incoming",
          is_outgoing: false,
          transaction: validTxHex,
          fee: toSats(10),
          created_at,
          is_confirmed: false,
          output_addresses: ["address1"],
          tokens: toSats(1000),
        },
      ],
    })
    expect(txs.length).toEqual(1)
    expect(txs[0].fee).toEqual(toSats(10))
  })

  it("filters txs with no valid hex", () => {
    const txs = extractIncomingTransactions(decoder, {
      transactions: [
        {
          id: "incoming",
          is_outgoing: false,
          fee: toSats(1),
          created_at,
          is_confirmed: false,
          output_addresses: ["address1"],
          tokens: toSats(1000),
        },
      ],
    })
    expect(txs.length).toEqual(0)
  })

  it("it defaults fee to 0 (only has fee set on outgoing tx)", () => {
    const txs = extractIncomingTransactions(decoder, {
      transactions: [
        {
          id: "incoming",
          is_outgoing: false,
          transaction: validTxHex,
          created_at,
          is_confirmed: false,
          output_addresses: ["address1"],
          tokens: toSats(1000),
        },
      ],
    })
    expect(txs.length).toEqual(1)
    expect(txs[0].fee).toEqual(toSats(0))
  })
})
