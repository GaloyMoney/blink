// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { Configuration, OAuth2Api } from "@ory/hydra-client"

const configuration = new Configuration({
  basePath: process.env.HYDRA_ADMIN_URL,
})

const hydraClient = new OAuth2Api(configuration)

export { hydraClient }
