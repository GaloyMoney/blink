import { TxDecoder, TransactionDecodeError } from "@/domain/bitcoin/onchain"
import { toSats } from "@/domain/bitcoin"

describe("decodeOnChainTransaction", () => {
  it("decodes a tx hex", () => {
    const validTxHex =
      "0100000001bcc1db7faba3226e49bf4b78c70433a5afa0b0c88b2f546d0eee07b40bdf70bc010000006a4730440220378952a9acd4fc40dfafba799be975f545793cc679a01c0d552dbb3e4c29556402205b50a6c5b9a541de3cde7519cbb5a8ebfa1bc49488be1ccf898f888ee5105691012102195646c22ab419c14599106960cc8587266cc0ad2189861c44c5eb3dfa771d3cffffffff0260b10a00000000001976a9145ace538e7c29931c5645e233d327af544dfcfa2f88ac1ef6ee19000000001976a9147452552d6ca38bbfc20f3d95dd3dbb4849a33f7d88ac00000000"

    const decoder = TxDecoder("mainnet" as BtcNetwork)
    let result = decoder.decode(validTxHex)
    expect(result).not.toBeInstanceOf(TransactionDecodeError)

    result = result as OnChainTransaction
    expect(result.txHash).toEqual(
      "88b81eff6bab7070be45640d5ffc95819e671cd7d5f294a448735eb1bb980a20",
    )
    expect(result.outs[0]).toEqual({
      address: "19H8z5HQ4tuuGZRYJH5xbG2P64KimjnLFx",
      sats: toSats(700768),
      vout: 0,
    })
  })

  it("can handle txs with OP_RETURN (utxo without address)", () => {
    const txWithOpReturn =
      "020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff4e03b4a10a045a9c79be4254432e636f6d2f6835367573fabe6d6d773e726b504adea24922b5449d207a6a190f1b6e5d811558811e009813b756fc020000008e9b20aa0a6e1fd83a8b010000000000ffffffff034d3a9c25000000001976a91474e878616bd5e5236ecb22667627eeecbff54b9f88ac0000000000000000266a24aa21a9edd78d77773f717ec2865633f8955f1344ee3645afc9021d6915819132dbd8c52e0000000000000000266a24b9e11b6dc64bb7816d47abb66e8a01770807e5e22a15a4f328526f56aac07884f364c2150120000000000000000000000000000000000000000000000000000000000000000000000000"

    const decoder = TxDecoder("mainnet" as BtcNetwork)
    let result = decoder.decode(txWithOpReturn)
    expect(result).not.toBeInstanceOf(TransactionDecodeError)

    result = result as OnChainTransaction
    expect(result.txHash).toEqual(
      "0ca352925d6afb2845c369be2f09aa12ffeb765b3dc88db05c865e8c02d642dd",
    )
    expect(result.outs[0]).toEqual({
      address: "1Bf9sZvBHPFGVPX71WX2njhd1NXKv5y7v5",
      sats: toSats(630995533),
      vout: 0,
    })
    expect(result.outs[1]).toEqual({
      address: null,
      sats: toSats(0),
      vout: 1,
    })
  })
})
