import { Configuration, OAuth2Api } from "@ory/hydra-client"

import { env } from "@/env"

const configuration = new Configuration({
  basePath: env.HYDRA_ADMIN_URL,
})

const hydraClient = new OAuth2Api(configuration)

export { hydraClient }
