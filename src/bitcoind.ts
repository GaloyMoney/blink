import _ from "lodash"
import { BitcoindClient, bitcoindDefaultClient, btc2sat } from "./utils"

export const getBalancesDetail = async (): Promise<
  { wallet: string; balance: number }[]
> => {
  // TODO: include default / outside?
  const wallets = await bitcoindDefaultClient.listWallets()

  const balances: { wallet: string; balance: number }[] = []

  for await (const wallet of wallets) {
    // do not use the default wallet for now (expect for testing).
    if (wallet === "") {
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
