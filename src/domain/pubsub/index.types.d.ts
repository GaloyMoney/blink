type PubSubServiceError = import("./errors").PubSubServiceError

type PubSubDefaultTrigger =
  (typeof import("./index").PubSubDefaultTriggers)[keyof typeof import("./index").PubSubDefaultTriggers]

type PubSubCustomTrigger = string & { readonly brand: unique symbol }

type PubSubTrigger = PubSubDefaultTrigger | PubSubCustomTrigger

type AsyncIteratorArgs = {
  trigger: PubSubTrigger | PubSubTrigger[]
}

type PublishArgs<T> = {
  trigger: PubSubTrigger
  payload: T
}

interface IPubSubService {
  createAsyncIterator: <T>({
    trigger,
  }: AsyncIteratorArgs) => AsyncIterator<T> | PubSubServiceError
  publish: <T>({ trigger, payload }: PublishArgs<T>) => Promise<void | PubSubServiceError>
  publishDelayed: <T>({
    trigger,
    payload,
  }: PublishArgs<T>) => Promise<void | PubSubServiceError>
}
