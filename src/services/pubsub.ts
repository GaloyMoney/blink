import { redisPubSub } from "./redis"

// TODO: add interface and proper error handling
const pubsub = {
  asyncIterator: (trigger: string | string[]) => redisPubSub.asyncIterator(trigger),

  publish: (triger: string, payload: unknown) => redisPubSub.publish(triger, payload),

  publishImmediate: (triger: string, payload: unknown) =>
    setImmediate(() => setImmediate(() => redisPubSub.publish(triger, payload))),
}

export default pubsub
