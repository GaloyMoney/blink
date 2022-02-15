import { networks, Psbt } from "bitcoinjs-lib"
import BIP32Factory from "bip32"
import * as ecc from "tiny-secp256k1"

import { ColdStorage, Wallets } from "@app"
import { BTC_NETWORK, getColdStorageConfig } from "@config"
import { InsufficientBalanceForRebalanceError } from "@domain/cold-storage/errors"

import { baseLogger } from "@services/logger"
import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"

import { BitcoindWalletClient } from "@services/bitcoind"
import { btc2sat } from "@domain/bitcoin"

import {
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  mineBlockAndSyncAll,
} from "test/helpers"
import { signer1Base58, signer2Base58 } from "test/helpers/multisig-wallet"

const bip32 = BIP32Factory(ecc)

let coldStorageWalletClient: BitcoindWalletClient
let walletName: string

beforeAll(async () => {
  const { onChainWallet } = getColdStorageConfig()

  const wallets = await bitcoindClient.listWallets()
  walletName =
    wallets.find((item) => item.includes(onChainWallet)) || "specter/coldstorage"

  coldStorageWalletClient = new BitcoindWalletClient(walletName)
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("ColdStorage - rebalanceToHotWallet", () => {
  it("creates a psbt successfully", async () => {
    const result = await ColdStorage.rebalanceToHotWallet({
      walletName,
      amount: 10000,
      targetConfirmations: 1,
    })
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toEqual(
      expect.objectContaining({
        transaction: expect.any(String),
        fee: expect.any(Number),
      }),
    )
  })

  it("successfully handle hot wallet deposit", async () => {
    const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
    if (onChainService instanceof Error) throw onChainService

    const rebalanceAmount = 10000
    const initialColdWalletBalance = await coldStorageWalletClient.getBalance()
    const initialHotWalletBalance = await onChainService.getBalance()
    if (initialHotWalletBalance instanceof Error) throw initialHotWalletBalance

    const result = await ColdStorage.rebalanceToHotWallet({
      walletName,
      amount: rebalanceAmount,
      targetConfirmations: 1,
    })
    if (result instanceof Error) throw result

    const signPsbt = (txBase64: string, signerBase58: string) => {
      const psbt = Psbt.fromBase64(txBase64, { network: networks.regtest })
      psbt.signAllInputsHD(bip32.fromBase58(signerBase58, networks.regtest))
      return psbt.toBase64()
    }

    // Simulate signing on different devices
    const psbtSigned1Base64 = signPsbt(result.transaction, signer1Base58)
    const psbtSigned2Base64 = signPsbt(result.transaction, signer2Base58)
    // Import from base64 to guarantee that there is no relationship between psbt objects
    const psbtSigned1 = Psbt.fromBase64(psbtSigned1Base64, { network: networks.regtest })
    const psbtSigned2 = Psbt.fromBase64(psbtSigned2Base64, { network: networks.regtest })

    const psbt = Psbt.fromBase64(result.transaction, { network: networks.regtest })
    psbt.combine(psbtSigned1, psbtSigned2)
    psbt.finalizeAllInputs()

    const txFee = psbt.getFee()
    const rawTxHex = psbt.extractTransaction().toHex()

    await bitcoindOutside.sendRawTransaction({ hexstring: rawTxHex })
    await mineBlockAndSyncAll()

    // this is done by trigger and/or cron in prod
    const updateResult = await Wallets.updateOnChainReceipt({ logger: baseLogger })
    if (updateResult instanceof Error) throw updateResult

    const finalColdWalletBalance = await coldStorageWalletClient.getBalance()
    const finalHotWalletBalance = await onChainService.getBalance()
    if (finalHotWalletBalance instanceof Error) throw finalHotWalletBalance

    expect(finalHotWalletBalance).toBe(initialHotWalletBalance + rebalanceAmount)
    expect(btc2sat(finalColdWalletBalance)).toBe(
      btc2sat(initialColdWalletBalance) - txFee - rebalanceAmount,
    )
  })

  it("fails if insufficient balance", async () => {
    const result = await ColdStorage.rebalanceToHotWallet({
      walletName,
      amount: 10_010_000_000,
      targetConfirmations: 1,
    })
    expect(result).toBeInstanceOf(InsufficientBalanceForRebalanceError)
  })
})
