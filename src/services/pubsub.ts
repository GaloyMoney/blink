import { redisPubSub } from "./redis"

const pubsub = {
  asyncIterator: (trigger: string) => redisPubSub.asyncIterator(trigger),

  publish: (triger: string, payload: unknown) => redisPubSub.publish(triger, payload),

  publishImmediate: (triger: string, payload: unknown) =>
    setImmediate(() => setImmediate(() => redisPubSub.publish(triger, payload))),
}

export default pubsub
