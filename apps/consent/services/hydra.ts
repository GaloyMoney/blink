import { env } from "@/env";
import { Configuration, OAuth2Api } from "@ory/hydra-client";

const configuration = new Configuration({
  basePath: env.HYDRA_ADMIN_URL,
});

const hydraClient = new OAuth2Api(configuration);

export { hydraClient };
