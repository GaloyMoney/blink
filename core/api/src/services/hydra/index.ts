import axios, { AxiosResponse } from "axios"

const hydraUrl = process.env.HYDRA_ADMIN_URL || "http://localhost:4445"

export const consentList = async (userId: UserId): Promise<ConsentSession[]> => {
  let res: AxiosResponse<any, any>

  try {
    res = await axios.get(
      `${hydraUrl}/admin/oauth2/auth/sessions/consent?subject=${userId}`,
    )
  } catch (err) {
    // TODO
    console.error(err)
    return []
  }

  let sessions: ConsentSession[]

  try {
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    sessions = res.data.map((request) => ({
      scope: request.grant_scope,
      handledAt: new Date(request.handled_at),
      remember: request.remember,
      app: request.consent_request.client.client_name,
    }))
  } catch (err) {
    // TODO
    console.error(err)
    return []
  }

  return sessions
}
