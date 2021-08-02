import { bitcoindDefaultClient, BitcoindWalletClient } from "@services/bitcoind"

export const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"
export const bitcoindClient = bitcoindDefaultClient // no wallet
export const bitcoindOutside = new BitcoindWalletClient({ walletName: "outside" })

export async function sendToAddressAndConfirm({
  walletClient,
  address,
  amount,
}: {
  walletClient: BitcoindWalletClient
  address: string
  amount: number
}) {
  await walletClient.sendToAddress({ address, amount })
  await walletClient.generateToAddress({ nblocks: 6, address: RANDOM_ADDRESS })
}

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
