import { ServerActionResponse } from "../index.types"

type ApiKeyBody = {
  apiKeySecret: string | undefined
}
export interface ApiKeyResponse extends ServerActionResponse<ApiKeyBody | null> {}
