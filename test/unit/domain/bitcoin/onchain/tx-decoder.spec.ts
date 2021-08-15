import { MakeTxDecoder, TransactionDecodeError } from "@domain/bitcoin/onchain"
import { toSats } from "@domain/bitcoin"

describe("decodeOnChainTransaction", () => {
  it("decodes a tx hex", () => {
    const validTxHex =
      "0100000001bcc1db7faba3226e49bf4b78c70433a5afa0b0c88b2f546d0eee07b40bdf70bc010000006a4730440220378952a9acd4fc40dfafba799be975f545793cc679a01c0d552dbb3e4c29556402205b50a6c5b9a541de3cde7519cbb5a8ebfa1bc49488be1ccf898f888ee5105691012102195646c22ab419c14599106960cc8587266cc0ad2189861c44c5eb3dfa771d3cffffffff0260b10a00000000001976a9145ace538e7c29931c5645e233d327af544dfcfa2f88ac1ef6ee19000000001976a9147452552d6ca38bbfc20f3d95dd3dbb4849a33f7d88ac00000000"

    const decoder = MakeTxDecoder("mainnet" as BtcNetwork)
    let result = decoder.decode(validTxHex)
    expect(result).not.toBeInstanceOf(TransactionDecodeError)

    result = result as OnChainTransaction
    expect(result.id).toEqual(
      "88b81eff6bab7070be45640d5ffc95819e671cd7d5f294a448735eb1bb980a20",
    )
    expect(result.outs[0]).toEqual({
      address: "19H8z5HQ4tuuGZRYJH5xbG2P64KimjnLFx",
      sats: toSats(700768),
    })
  })
})
