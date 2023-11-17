import { ServerActionResponse } from "../index.types"

type CallBackAdditionBody = {
  CallBackAdditionSecret: string | undefined
}
export interface CallBackAdditionResponse
  extends ServerActionResponse<CallBackAdditionBody | null> {}

type CallBackDeletionBody = {
  CallBackDeletionSecret: string | undefined
}
export interface CallBackDeletionResponse
  extends ServerActionResponse<CallBackDeletionBody | null> {}
