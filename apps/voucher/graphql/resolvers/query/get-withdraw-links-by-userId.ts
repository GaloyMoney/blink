import { getServerSession } from "next-auth"

import { getWithdrawLinksByUserIdQuery } from "@/services/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"

export const getWithdrawLinksByUserId = async (
  _: undefined,
  args: {
    status?: string
  },
) => {
  const { status } = args

  const session = await getServerSession(authOptions)
  const userData = session?.userData
  if (!userData || !userData?.me?.defaultAccount?.wallets) {
    return new Error("Unauthorized")
  }

  const data = await getWithdrawLinksByUserIdQuery({
    userId: userData.me.id,
    status,
  })
  if (data instanceof Error) {
    return new Error("Internal server error")
  }
  return data
}
