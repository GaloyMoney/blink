import { UnknownRepositoryError } from "@domain/errors"

import { BriaEventModel } from "./schema"

export const BriaEventRepo = () => {
  const persistEvent = async (event: BriaEvent): Promise<true | RepositoryError> => {
    try {
      // TODO: More sophisticated translation if we use this Repo for more than getting out Sequence
      const eventModel = {
        ...event,
        payload: {
          ...event.payload,
          satoshis: Number(event.payload.satoshis.amount),
        },
      }
      const newEvent = new BriaEventModel(eventModel)
      await newEvent.save()
      return true
    } catch (err) {
      if (err instanceof Error) return new UnknownRepositoryError(err.message)
      return new UnknownRepositoryError()
    }
  }

  const getLatestSequence = async (): Promise<number | RepositoryError> => {
    try {
      const latestEvent = await BriaEventModel.findOne().sort({ sequence: -1 })
      return latestEvent ? latestEvent.sequence : 0
    } catch (err) {
      if (err instanceof Error) return new UnknownRepositoryError(err.message)
      return new UnknownRepositoryError()
    }
  }

  return {
    persistEvent,
    getLatestSequence,
  }
}
