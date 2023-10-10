export enum LoginType {
  phone = "Phone",
  email = "Email",
}

export interface ServerActionResponse<ResponseBody> {
  error: boolean;
  message: string;
  responsePayload: ResponseBody;
}
