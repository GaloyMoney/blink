import { RewardAlreadyPresentError, UnknownRepositoryError } from "@domain/errors"
import { User } from "./schema"

// FIXME: improve boundary
export const RewardsRepository = (accountId: AccountId) => {
  const tentativelyAddNew = async (quizQuestionId: QuizQuestionId) => {
    try {
      // by default, mongodb return the previous state before the update
      const oldState = await User.findOneAndUpdate(
        { _id: accountId },
        { $push: { earn: quizQuestionId } },
        // { upsert: true },
      )

      const rewardNotFound =
        oldState.earn.findIndex((item) => item === quizQuestionId) === -1

      if (rewardNotFound) {
        return true
      } else {
        return new RewardAlreadyPresentError()
      }
    } catch (err) {
      return new UnknownRepositoryError("reward issue")
    }
  }

  return {
    tentativelyAddNew,
  }
}
