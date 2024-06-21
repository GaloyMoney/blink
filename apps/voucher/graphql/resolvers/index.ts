import { getWithdrawLink } from "./query/get-withdraw-link"
import { getWithdrawLinksByUserId } from "./query/get-withdraw-links-by-userId"
import { createWithdrawLink } from "./mutation/create-withdraw-link"
import { redeemWithdrawLinkOnChain } from "./mutation/redeem-withdraw-link-on-chain"

const resolvers = {
  Query: {
    getWithdrawLink,
    getWithdrawLinksByUserId,
  },

  Mutation: {
    createWithdrawLink,
    redeemWithdrawLinkOnChain,
  },
}

export default resolvers
