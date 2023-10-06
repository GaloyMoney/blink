import { authenticatedBitcoind, createWallet, importDescriptors } from "bitcoin-cli-ts"

import {
  BitcoindClient,
  bitcoindDefaultClient,
  BitcoindSignerWalletClient,
  BitcoindWalletClient,
  getBitcoinCoreSignerRPCConfig,
} from "./bitcoind"

import { descriptors as signerDescriptors } from "./signer-wallet"

import { lndCreateOnChainAddress } from "./wallet"

import { waitUntilBlockHeight } from "./lightning"

import { LedgerService } from "@/services/ledger"

import { toSats } from "@/domain/bitcoin"
import { parseErrorMessageFromUnknown } from "@/domain/shared"

import { updateLegacyOnChainReceipt } from "@/app/wallets"

import { baseLogger } from "@/services/logger"

export const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"
export const bitcoindClient = bitcoindDefaultClient // no wallet
export const bitcoindSignerClient = new BitcoindClient(getBitcoinCoreSignerRPCConfig())
export const bitcoindOutside = new BitcoindWalletClient("outside")
export const bitcoindSignerWallet = new BitcoindSignerWalletClient("dev")

export async function sendToAddressAndConfirm({
  walletClient,
  address,
  amount,
}: {
  walletClient: BitcoindWalletClient
  address: OnChainAddress
  amount: number
}): Promise<OnChainTxHash | Error> {
  let txId: OnChainTxHash | Error
  try {
    txId = (await walletClient.sendToAddress({ address, amount })) as OnChainTxHash
  } catch (err) {
    const errMsg = parseErrorMessageFromUnknown(err)
    txId = new Error(errMsg)
  }

  await walletClient.generateToAddress({ nblocks: 6, address: RANDOM_ADDRESS })

  return txId
}

export const sendToAddress = async ({
  walletClient,
  address,
  amount,
}: {
  walletClient: BitcoindWalletClient
  address: OnChainAddress
  amount: number
}) => walletClient.sendToAddress({ address, amount })

export async function mineAndConfirm({
  walletClient,
  numOfBlocks,
  address,
}: {
  walletClient: BitcoindWalletClient
  numOfBlocks: number
  address: string
}): Promise<number> {
  // from: https://developer.bitcoin.org/examples/testing.html
  // Unlike mainnet, in regtest mode only the first 150 blocks pay a reward of 50 bitcoins.
  // However, a block must have 100 confirmations before that reward can be spent,
  // so we generate 101 blocks to get access to the coinbase transaction from block #1.

  const blockNumber = await bitcoindDefaultClient.getBlockCount()

  await walletClient.generateToAddress({ nblocks: numOfBlocks, address })
  await walletClient.generateToAddress({ nblocks: 101, address: RANDOM_ADDRESS })

  let rewards = 0
  for (let i = 1; i <= numOfBlocks; i++) {
    rewards = rewards + getBlockReward(blockNumber + i)
  }

  return rewards
}

/**
 * Get the bitcoin reward for the given height. Based on bitcoin-core implementation
 * @method getBlockReward
 * @param  height=0          block height
 * @param  halvingBlocks=150 halving blocks. regtest = 150 - mainnet = 210000
 * @return                   block reward in satoshis
 */
function getBlockReward(height = 0, halvingBlocks = 150) {
  const halvings = BigInt(height) / BigInt(halvingBlocks)
  if (halvings >= 64) return 0

  let reward = BigInt(50 * 100000000)
  reward >>= halvings
  return Number(reward)
}

export const fundWalletIdFromOnchain = async ({
  walletId,
  amountInBitcoin,
  lnd,
}: {
  walletId: WalletId
  amountInBitcoin: number
  lnd: AuthenticatedLnd
}): Promise<Satoshis> => {
  const address = await lndCreateOnChainAddress(walletId)
  if (address instanceof Error) throw address

  await sendToAddressAndConfirm({
    walletClient: bitcoindOutside,
    address,
    amount: amountInBitcoin,
  })

  await waitUntilBlockHeight({ lnd })

  await updateLegacyOnChainReceipt({ logger: baseLogger })

  const balance = await LedgerService().getWalletBalance(walletId)
  if (balance instanceof Error) throw balance

  return toSats(balance)
}

export const createSignerWallet = async (walletName: string) => {
  const bitcoindSigner = getBitcoindSignerClient()
  const wallet = await createWallet({
    bitcoind: bitcoindSigner,
    wallet_name: walletName,
    disable_private_keys: false,
    descriptors: true,
  })

  const bitcoindSignerWallet = getBitcoindSignerClient(walletName)
  const result = await importDescriptors({
    bitcoind: bitcoindSignerWallet,
    requests: signerDescriptors,
  })

  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  if (result.some((d) => !d.success)) throw new Error("Invalid descriptors")

  return wallet
}

const getBitcoindSignerClient = (walletName?: string) => {
  const { host, username, password, port, timeout } = getBitcoinCoreSignerRPCConfig()
  return authenticatedBitcoind({
    protocol: "http",
    host: host || "",
    username,
    password,
    timeout,
    port,
    walletName,
  })
}
