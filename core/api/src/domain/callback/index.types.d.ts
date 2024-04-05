type CallbackEventType =
  (typeof import("./index").CallbackEventType)[keyof typeof import("./index").CallbackEventType]

type AccountCallbackId = string & { readonly brand: unique symbol }
