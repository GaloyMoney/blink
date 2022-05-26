import { createHash } from "crypto"

export const getHash = (data: string): string => {
  const hash = createHash("sha256")
  return hash.update(data).digest("hex")
}

export const GenerateLeaves = (liabilities: Liabilities[]): TreeNode[] => {
  const leaves: TreeNode[] = []
  liabilities.forEach((liability: Liabilities, idx: number) => {
    const hash = getHash(`${liability.accountId}${liability.walletBalance}${idx}`)
    const leaf: TreeNode = {
      hash: hash,
      sum: liability.walletBalance,
    }
    leaves.push(leaf)
  })
  return leaves
}
