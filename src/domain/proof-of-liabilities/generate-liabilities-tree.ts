import { getHash } from "@domain/proof-of-liabilities/generate-leaves"
import { toSats } from "@domain/bitcoin"

const getSum = (
  val1: CurrencyBaseAmount,
  val2: CurrencyBaseAmount,
): CurrencyBaseAmount => {
  return toSats(parseInt(val1.toString()) + parseInt(val2.toString()))
}
export const GenerateLiabilitiesTree = (leaves: TreeNode[]) => {
  const tree = [leaves]
  let nodesInARow = leaves.length / 2
  let rowIndex = 0
  while (nodesInARow >= 1) {
    const rowNodes: TreeNode[] = []
    for (let i = 0; i < nodesInARow; i++) {
      const leftChild = tree[rowIndex][i * 2]
      const rightChild = tree[rowIndex][i * 2 + 1]
      const hash = getHash(
        `${leftChild.hash}${leftChild.sum}${rightChild.hash}${rightChild.sum}`,
      )
      const node: TreeNode = {
        hash: hash,
        sum: getSum(leftChild.sum, rightChild.sum),
      }
      rowNodes.push(node)
    }
    nodesInARow = nodesInARow >> 1
    tree.push(rowNodes)
    rowIndex++
  }
  return tree.reverse()
}
