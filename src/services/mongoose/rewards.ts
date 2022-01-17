import { RewardAlreadyPresentError, UnknownRepositoryError } from "@domain/errors"

import { Types as MongooseTypes } from "mongoose"

import { User } from "./schema"

// FIXME: improve boundary
export const RewardsRepository = (accountId: AccountId) => {
  const add = async (quizQuestionId: QuizQuestionId) => {
    try {
      // by default, mongodb return the previous state before the update
      const oldState = await User.findOneAndUpdate(
        { _id: new MongooseTypes.ObjectId(accountId) },
        { $push: { earn: quizQuestionId } },
        // { upsert: true },
      )

      const rewardNotFound =
        oldState.earn.findIndex((item) => item === quizQuestionId) === -1

      return rewardNotFound || new RewardAlreadyPresentError()
    } catch (err) {
      return new UnknownRepositoryError("reward issue")
    }
  }

  return {
    add,
  }
}
