import { redisPubSub } from "./redis"

import { PubSubServiceError, UnknownPubSubError } from "@/domain/pubsub"

import { sleep } from "@/utils"

export const PubSubService = (): IPubSubService => {
  const createAsyncIterator = <T>({
    trigger,
  }: AsyncIteratorArgs): AsyncIterator<T> | PubSubServiceError => {
    try {
      return redisPubSub.asyncIterator(trigger)
    } catch (err) {
      return new UnknownPubSubError(err)
    }
  }

  const publish = async <T>({
    trigger,
    payload,
  }: PublishArgs<T>): Promise<void | PubSubServiceError> => {
    try {
      return await redisPubSub.publish(trigger, payload)
    } catch (err) {
      return new UnknownPubSubError(err)
    }
  }

  const publishDelayed = async <T>({
    trigger,
    payload,
  }: PublishArgs<T>): Promise<void | PubSubServiceError> => {
    // this is a "hack" to make sure the subscription is created before publishing
    // this is because we rely on subscription (as an alternative to query)
    // to know if some events (like payment) are successful or not
    // this bring down some complexity on the client side but addomg some quirks here
    await sleep(10)
    publish({ trigger, payload })
  }

  return {
    createAsyncIterator,
    publish,
    publishDelayed,
  }
}
