type CallbackServiceError = import("./errors").CallbackServiceError

type CallbackEventType =
  (typeof import("./index").CallbackEventType)[keyof typeof import("./index").CallbackEventType]

type AccountCallbackId = string & { readonly brand: unique symbol }

interface ICallbackService {
  sendMessage: (args: {
    eventType: string
    accountId: AccountId
    walletId: WalletId
    payload: Record<string, JSONValue>
  }) => Promise<CallbackServiceError | true>
  getPortalUrl: (accountId: AccountId) => Promise<CallbackServiceError | string>
  addEndpoint: (args: {
    accountId: AccountId
    url: string
  }) => Promise<CallbackServiceError | string>
  listEndpoints: (
    accountId: AccountId,
  ) => Promise<CallbackServiceError | { id: string; url: string }[]>
  deleteEndpoint: (args: {
    accountId: AccountId
    endpointId: string
  }) => Promise<CallbackServiceError | true>
}
