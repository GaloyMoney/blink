import { HYDRA_ADMIN_URL } from "@/env";
import { Configuration, OAuth2Api } from "@ory/hydra-client";

const configuration = new Configuration({
  basePath: HYDRA_ADMIN_URL,
});

const hydraClient = new OAuth2Api(configuration);

export { hydraClient };
