import { PubSubServiceError, UnknownPubSubError } from "@domain/pubsub"

import { redisPubSub } from "./redis"

export const PubSubService = (): IPubSubService => {
  const createAsyncIterator = <T>({
    trigger,
  }: AsyncIteratorArgs): AsyncIterator<T> | PubSubServiceError => {
    try {
      return redisPubSub.asyncIterator(trigger)
    } catch (err) {
      return new UnknownPubSubError(err && err.message)
    }
  }

  const publish = async <T>({
    trigger,
    payload,
  }: PublishArgs<T>): Promise<void | PubSubServiceError> => {
    try {
      return await redisPubSub.publish(trigger, payload)
    } catch (err) {
      return new UnknownPubSubError(err && err.message)
    }
  }

  const publishImmediate = <T>({
    trigger,
    payload,
  }: PublishArgs<T>): NodeJS.Immediate => {
    return setImmediate(() => setImmediate(() => publish({ trigger, payload })))
  }

  return {
    createAsyncIterator,
    publish,
    publishImmediate,
  }
}
