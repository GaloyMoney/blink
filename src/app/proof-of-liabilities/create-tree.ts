import { WalletsRepository } from "@services/mongoose"
import { CreateLiabilities } from "@domain/proof-of-liabilities/create-liabilities"
import { GenerateLeaves } from "@domain/proof-of-liabilities/generate-leaves"
import { GenerateLiabilitiesTree } from "@domain/proof-of-liabilities/generate-liabilities-tree"

export const createTree = async () => {
  const wallets = await WalletsRepository().findAll()
  if (wallets instanceof Error) return wallets
  const liabilities = await CreateLiabilities(wallets)
  if (liabilities instanceof Error) return liabilities
  const leaves = GenerateLeaves(liabilities)
  const tree = GenerateLiabilitiesTree(leaves)
  return tree
}
