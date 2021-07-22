import _ from "lodash"
import { BitcoindClient, bitcoindDefaultClient, btc2sat } from "./utils"

export const getBalancesDetail = async (): Promise<
  { wallet: string; balance: number }[]
> => {
  const wallets = await bitcoindDefaultClient.listWallets()

  const balances: { wallet: string; balance: number }[] = []

  for await (const wallet of wallets) {
    // do not consider the "outside" wallet in tests (and "default" should be coinless, so it shouldn't need to be here...)
    if (wallet === "outside") {
      continue
    }

    const client = BitcoindClient({ wallet })
    const balance = btc2sat(await client.getBalance())
    balances.push({ wallet, balance })
  }

  return balances
}

export const getBalance = async (): Promise<number> => {
  const balanceObj = await getBalancesDetail()
  return _.sumBy(balanceObj, "balance")
}
