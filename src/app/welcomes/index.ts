import { NewWelcomeCacheState } from "@domain/welcomes"

const WelcomeCache = () => {
  const load = () => {
    return NewWelcomeCacheState()
  }
  return { load }
}

export const updateWelcomes = (): true => {
  const state = WelcomeCache().load()
  //
  // to determin the state of all referals in our system
  // we can execute a fold over our transaction database
  // latestReferalState = getLatestReferalState()
  // candidates = ledgerFacade.getAllTransactionsSettledViaIntraLedger(state.lastUpdate)
  // state: ReferalState = initialState
  // for each tx in candidates <- lazy iterator
  const tx = {}
  state.updateFromNewTransactions([tx])
  //   if isReferal(state, candidate) {
  //     state.addReferal(candidate)
  //   }
  //   if isIndirectReferall(state, candidate) {
  //     state.addIndirectReferal(candidate)
  //   }
  // end
  // persistState(state)
  // for userReferalData in state.updatedUserData
  //   upsertUserReferalData(userReferalData)
  // end
  //
  // NEEDED QUERIES
  //
  // state.initiationProfiles()
  // WelcomeProfileRepository.update(state.initiationProfiles())
  // getTopReferers
  // getUserRefererRank
  // getUserRefererCount
  return true
}
