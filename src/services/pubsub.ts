import { redisPubSub } from "./redis"

// TODO: add interface and proper error handling
const pubsub = {
  asyncIterator: (trigger: string | string[]) => redisPubSub.asyncIterator(trigger),

  publish: (trigger: string, payload: unknown) => redisPubSub.publish(trigger, payload),

  publishImmediate: (trigger: string, payload: unknown) =>
    setImmediate(() => setImmediate(() => redisPubSub.publish(trigger, payload))),
}

export default pubsub
