import { bitcoindDefaultClient } from "src/utils"

export const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"
export const bitcoindClient = bitcoindDefaultClient

bitcoindDefaultClient.sendToAddressAndConfirm = async (address, amount) => {
  await bitcoindDefaultClient.sendToAddress(address, amount)
  await bitcoindDefaultClient.generateToAddress(6, RANDOM_ADDRESS)
}

// from: https://developer.bitcoin.org/examples/testing.html
// Unlike mainnet, in regtest mode only the first 150 blocks pay a reward of 50 bitcoins.
// However, a block must have 100 confirmations before that reward can be spent,
// so we generate 101 blocks to get access to the coinbase transaction from block #1.

bitcoindDefaultClient.mineAndConfirm = async (numOfBlocks, address): Promise<number> => {
  const blockNumber = await bitcoindDefaultClient.getBlockCount()

  await bitcoindClient.generateToAddress(numOfBlocks, address)
  await bitcoindClient.generateToAddress(100, RANDOM_ADDRESS)

  let rewards = 0
  for (let i = 0; i < numOfBlocks; i++) {
    rewards = rewards + getBlockReward(blockNumber + i)
  }

  return rewards
}

function getBlockReward(
  blockNumber: number,
  halvingBlocks = 150,
  blockReward = 50,
): number {
  const halving = (r, times) => {
    if (times === 1) return r
    return halving(financial(r / 2), times - 1)
  }
  return halving(blockReward, Math.ceil((blockNumber || 1) / halvingBlocks))
}

function financial(x, digits = 8) {
  const factor = Math.pow(10, digits)
  return Math.trunc(x * factor) / factor
}
