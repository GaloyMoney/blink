import dedent from "dedent"

import Network from "../scalar/network"

import Country from "./country"
import FeesInformation from "./fees-information"
import BuildInformation from "./build-information"

import { GT } from "@/graphql/index"

const Globals = GT.Object({
  name: "Globals",
  description:
    "Provides global settings for the application which might have an impact for the user.",
  fields: () => ({
    nodesIds: {
      type: GT.NonNullList(GT.String),
      description: dedent`A list of public keys for the running lightning nodes.
        This can be used to know if an invoice belongs to one of our nodes.`,
    },
    network: {
      type: GT.NonNull(Network),
      description: dedent`Which network (mainnet, testnet, regtest, signet) this instance is running on.`,
    },
    buildInformation: { type: GT.NonNull(BuildInformation) },
    lightningAddressDomain: {
      type: GT.NonNull(GT.String),
      description: dedent`The domain name for lightning addresses accepted by this Galoy instance`,
    },
    supportedCountries: {
      type: GT.NonNullList(Country),
      description: dedent`A list of countries and their supported auth channels`,
    },
    lightningAddressDomainAliases: {
      type: GT.NonNullList(GT.String),
    },
    feesInformation: {
      type: GT.NonNull(FeesInformation),
    },
  }),
})

export default Globals
