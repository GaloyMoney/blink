export enum LoginType {
  phone = "Phone",
  email = "Email",
}

export enum SubmitValue {
  allowAccess = "Allow access",
  denyAccess = "Deny access",
}

export interface ServerActionResponse<ResponseBody> {
  error: boolean
  message: string | null
  responsePayload: ResponseBody
}
