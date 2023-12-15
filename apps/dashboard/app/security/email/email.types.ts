import { ServerActionResponse } from "@/app/index.types"

type AddEmailBody = null
export interface AddEmailResponse extends ServerActionResponse<AddEmailBody | null> {}

type VerifyEmailBody = null
export interface VerifyEmailResponse
  extends ServerActionResponse<VerifyEmailBody | null> {}
