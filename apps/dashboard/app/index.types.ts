export interface ServerActionResponse<ResponseBody> {
  error: boolean
  message: string | null
  responsePayload: ResponseBody
}
