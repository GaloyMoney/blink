import { NewWelcomeCacheState, ledgerTxToPossibleWelcomeTx } from "@domain/welcomes"
import { LedgerService } from "@services/ledger"
import { WelcomeProfileRepository } from "@services/welcome-profiles"
const WelcomeCache = () => {
  const load = () => {
    return NewWelcomeCacheState()
  }

  const save = (newState) => {}

  return { load, save }
}

export const updateWelcomes = async (): Promise<true | ApplicationError> => {
  const state = WelcomeCache().load()

  const transactionIterator = LedgerService().getAllTransactions()

  for await (const tx of transactionIterator) {
    if (tx instanceof Error) {
      return tx
    }
    state.updateFromNewTransactions([
      ledgerTxToPossibleWelcomeTx({
        tx,
        accountIdForWalletId: (id) => id as unknown as AccountId, // TODO implement this function
      }),
    ])
  }

  WelcomeCache().save(state)

  const directWelcomes = state.generateWelcomeProfiles({
    outCircleDepth: 2,
  })

  WelcomeProfileRepository().save(directWelcomes)

  return true
}

// to determin the state of all referals in our system
// we can execute a fold over our transaction database
// latestReferalState = getLatestReferalState()
// candidates = ledgerFacade.getAllTransactionsSettledViaIntraLedger(state.lastUpdate)
// state: ReferalState = initialState
// for each tx in candidates <- lazy iterator
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

export const getLeaders = (): WelcomeProfile[] => {
  return WelcomeProfileRepository().getLeaders()
}
