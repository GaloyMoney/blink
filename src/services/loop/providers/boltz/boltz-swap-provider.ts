import { ISwapProvider } from "@services/loop/index.types"

const boltzSwapProvider: ISwapProvider = {
  loopOut: async (amount) => {
    return Promise.resolve(`Please implement me! Boltz ${amount}`)
  },
}

export default boltzSwapProvider
