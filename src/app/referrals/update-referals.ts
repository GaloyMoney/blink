// import { isReferal } from "@domain/referals"

export const updateReferals = (): true => {
  // to determin the state of all referals in our system
  // we can execute a fold over our transaction database
  //
  // latestReferalState = getLatestReferalState()
  // candidates = ledgerFacade.getAllTransactionsSettledViaIntraLedger(state.lastUpdate)
  // state: ReferalState = initialState
  // for each candidate in candidates <- lazy iterator
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
  // getTopReferers
  // getUserRefererRank
  // getUserRefererCount
  return true
}
