import { AccountStatus } from "@domain/accounts/primitives"
import { DisplayCurrency } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"

const displayCurrencyConfigSchema = {
  type: "object",
  properties: {
    code: { type: "string", enum: Object.values(DisplayCurrency) },
    symbol: { type: "string" },
  },
  required: ["code", "symbol"],
  additionalProperties: false,
  default: {
    code: "USD",
    symbol: "$",
  },
} as const

const dealerConfigSchema = {
  type: "object",
  properties: {
    usd: {
      type: "object",
      properties: {
        hedgingEnabled: { type: "boolean" },
      },
      required: ["hedgingEnabled"],
    },
  },
  required: ["usd"],
  default: {
    usd: {
      hedgingEnabled: false,
    },
  },
} as const

const buildNumberConfigSchema = {
  type: "object",
  properties: {
    minBuildNumber: { type: "integer" },
    lastBuildNumber: { type: "integer" },
  },
  required: ["minBuildNumber", "lastBuildNumber"],
  additionalProperties: false,
} as const

const accountLimitConfigSchema = {
  type: "object",
  properties: {
    level: {
      type: "object",
      properties: {
        1: { type: "integer" },
        2: { type: "integer" },
      },
      required: ["1", "2"],
      additionalProperties: false,
    },
  },
  required: ["level"],
  additionalProperties: false,
}

const rateLimitConfigSchema = {
  type: "object",
  properties: {
    points: { type: "integer" },
    duration: { type: "integer" },
    blockDuration: { type: "integer" },
  },
  required: ["points", "duration", "blockDuration"],
  additionalProperties: false,
}

const lndConfig = {
  type: "object",
  properties: {
    name: { type: "string" },
    type: {
      type: "array",
      items: { enum: ["offchain", "onchain"] },
      uniqueItems: true,
    },
    priority: { type: "integer" },
  },
  required: ["name", "type", "priority"],
  additionalProperties: false,
}

export const configSchema = {
  type: "object",
  properties: {
    PROXY_CHECK_APIKEY: { type: "string" }, // TODO: move out of yaml and to env
    name: { type: "string", default: "Galoy Banking" },
    lightningAddressDomain: { type: "string", default: "pay.domain.com" },
    lightningAddressDomainAliases: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      default: ["pay1.domain.com", "pay2.domain.com"],
    },
    locale: { type: "string", enum: ["en", "es"], default: "en" },
    displayCurrency: displayCurrencyConfigSchema,
    funder: { type: "string", default: "FunderWallet" },
    dealer: dealerConfigSchema,
    ratioPrecision: { type: "number", default: 1000000 },
    buildVersion: {
      type: "object",
      properties: {
        android: buildNumberConfigSchema,
        ios: buildNumberConfigSchema,
      },
      default: {
        android: {
          minBuildNumber: 182,
          lastBuildNumber: 294,
        },
        ios: {
          minBuildNumber: 182,
          lastBuildNumber: 269,
        },
      },
      required: ["ios", "android"],
      additionalProperties: false,
    },
    rewards: {
      type: "object",
      properties: {
        allowPhoneCountries: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
        denyPhoneCountries: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
        allowIPCountries: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
        denyIPCountries: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
        allowASNs: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
        denyASNs: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
      },
      required: [
        "allowPhoneCountries",
        "denyPhoneCountries",
        "allowIPCountries",
        "denyIPCountries",
        "allowASNs",
        "denyASNs",
      ],
      additionalProperties: false,
      default: {
        allowPhoneCountries: ["SV"],
        denyPhoneCountries: [],
        allowIPCountries: [],
        denyIPCountries: [],
        allowASNs: [],
        denyASNs: [],
      },
    },
    coldStorage: {
      type: "object",
      properties: {
        minOnChainHotWalletBalance: { type: "integer" },
        minRebalanceSize: { type: "integer" },
        maxHotWalletBalance: { type: "integer" },
        walletPattern: { type: "string" },
        // TODO: confusing: 2 properties with the same name
        onChainWallet: { type: "string" },
        targetConfirmations: { type: "integer" },
      },
      required: [
        "minOnChainHotWalletBalance",
        "minRebalanceSize",
        "maxHotWalletBalance",
        "walletPattern",
        "targetConfirmations",
      ],
      additionalProperties: false,
      default: {
        minOnChainHotWalletBalance: 1000000,
        minRebalanceSize: 10000000,
        maxHotWalletBalance: 200000000,
        walletPattern: "specter",
        // TODO: confusing: 2 properties with the same name
        onChainWallet: "specter/coldstorage",
        targetConfirmations: 6,
      },
    },
    lndScbBackupBucketName: { type: "string", default: "lnd-static-channel-backups" },
    test_accounts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "string" },
          phone: { type: "string" },
          code: { type: "string" },
          needUsdWallet: { type: "boolean" },
          username: { type: "string" },
          phoneMetadataCarrierType: { type: "string" },
          title: { type: "string" },
          role: { type: "string" },
          currency: { type: "string" },
        },
        required: ["ref", "phone", "code"],
        additionalProperties: false,
      },
      default: [
        {
          ref: "A",
          phone: "+16505554321",
          code: "321321",
          needUsdWallet: true,
        },
        {
          ref: "B",
          phone: "+16505554322",
          code: "321432",
          needUsdWallet: true,
          phoneMetadataCarrierType: "mobile",
        },
        {
          ref: "C",
          phone: "+16505554323",
          code: "321321",
          title: "business",
        },
        {
          ref: "D",
          phone: "+16505554324",
          code: "321321",
          needUsdWallet: true,
        },
        {
          ref: "E",
          phone: "+16505554332",
          code: "321321",
        },
        {
          ref: "F",
          phone: "+16505554333",
          code: "321321",
          needUsdWallet: true,
        },
        {
          ref: "G",
          phone: "+16505554335",
          code: "321321",
          username: "user15",
        },
        {
          ref: "H",
          phone: "+19876543210",
          code: "321321",
          username: "tester",
        },
        {
          ref: "I",
          phone: "+19876543336",
          code: "321321",
          role: "editor",
          username: "editor",
        },
      ],
      uniqueItems: true,
    },
    rateLimits: {
      type: "object",
      properties: {
        requestPhoneCodePerPhone: rateLimitConfigSchema,
        requestPhoneCodePerPhoneMinInterval: rateLimitConfigSchema,
        requestPhoneCodePerIp: rateLimitConfigSchema,
        failedLoginAttemptPerPhone: rateLimitConfigSchema,
        failedLoginAttemptPerEmailAddress: rateLimitConfigSchema,
        failedLoginAttemptPerIp: rateLimitConfigSchema,
        invoiceCreateAttempt: rateLimitConfigSchema,
        invoiceCreateForRecipientAttempt: rateLimitConfigSchema,
        onChainAddressCreateAttempt: rateLimitConfigSchema,
      },
      required: [
        "requestPhoneCodePerPhone",
        "requestPhoneCodePerPhoneMinInterval",
        "requestPhoneCodePerIp",
        "failedLoginAttemptPerPhone",
        "failedLoginAttemptPerEmailAddress",
        "failedLoginAttemptPerIp",
        "invoiceCreateAttempt",
        "invoiceCreateForRecipientAttempt",
        "onChainAddressCreateAttempt",
      ],
      additionalProperties: false,
      default: {
        requestPhoneCodePerPhone: {
          points: 4,
          duration: 3600,
          blockDuration: 10800,
        },
        requestPhoneCodePerPhoneMinInterval: {
          points: 1,
          duration: 15,
          blockDuration: 15,
        },
        requestPhoneCodePerIp: {
          points: 8,
          duration: 3600,
          blockDuration: 86400,
        },
        failedLoginAttemptPerPhone: {
          points: 8,
          duration: 1200,
          blockDuration: 3600,
        },
        failedLoginAttemptPerEmailAddress: {
          points: 8,
          duration: 1200,
          blockDuration: 3600,
        },
        failedLoginAttemptPerIp: {
          points: 20,
          duration: 21600,
          blockDuration: 86400,
        },
        invoiceCreateAttempt: {
          points: 20,
          duration: 120,
          blockDuration: 300,
        },
        invoiceCreateForRecipientAttempt: {
          points: 20,
          duration: 120,
          blockDuration: 300,
        },
        onChainAddressCreateAttempt: {
          points: 20,
          duration: 3600,
          blockDuration: 14400,
        },
      },
    },
    accounts: {
      type: "object",
      properties: {
        initialStatus: { type: "string", enum: Object.values(AccountStatus) },
        initialWallets: {
          type: "array",
          items: {
            type: "string",
            enum: Object.values(WalletCurrency),
          },
        },
      },
      required: ["initialStatus", "initialWallets"],
      additionalProperties: false,
      default: {
        initialStatus: "active",
        initialWallets: ["BTC"],
      },
    },
    accountLimits: {
      type: "object",
      properties: {
        withdrawal: accountLimitConfigSchema,
        intraLedger: accountLimitConfigSchema,
        tradeIntraAccount: accountLimitConfigSchema,
      },
      required: ["withdrawal", "intraLedger", "tradeIntraAccount"],
      additionalProperties: false,
      default: {
        withdrawal: {
          level: {
            "1": 100000,
            "2": 5000000,
          },
        },
        intraLedger: {
          level: {
            "1": 200000,
            "2": 5000000,
          },
        },
        tradeIntraAccount: {
          level: {
            "1": 5000000,
            "2": 20000000,
          },
        },
      },
    },
    spamLimits: {
      type: "object",
      properties: {
        memoSharingSatsThreshold: { type: "integer" },
        memoSharingCentsThreshold: { type: "integer" },
      },
      required: ["memoSharingSatsThreshold", "memoSharingCentsThreshold"],
      additionalProperties: false,
      default: {
        memoSharingSatsThreshold: 1000,
        memoSharingCentsThreshold: 50,
      },
    },
    ipRecording: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        proxyChecking: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
          },
          required: ["enabled"],
          additionalProperties: false,
        },
      },
      required: ["enabled"],
      additionalProperties: false,
      default: {
        enabled: true,
        proxyChecking: {
          enabled: true,
        },
      },
    },
    fees: {
      type: "object",
      properties: {
        deposit: { type: "number" },
        withdraw: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["flat", "proportionalOnImbalance"],
            },
            ratio: { type: "number" },
            threshold: { type: "integer" },
            daysLookback: { type: "integer" },
            defaultMin: { type: "integer" },
          },
          required: ["method", "ratio", "threshold", "daysLookback", "defaultMin"],
          additionalProperties: false,
          default: {
            method: "flat",
            defaultMin: 2000,
            ratio: 0.005,
            threshold: 1000000,
            daysLookback: 30,
          },
        },
      },
      required: ["withdraw", "deposit"],
      additionalProperties: false,
      default: {
        withdraw: {
          method: "flat",
          defaultMin: 2000,
          ratio: 0.005,
          threshold: 1000000,
          daysLookback: 30,
        },
        deposit: 0.003,
      },
    },
    lnds: {
      type: "array",
      items: lndConfig,
      uniqueItems: true,
      default: [
        {
          name: "LND1",
          type: ["offchain", "onchain"],
          priority: 2,
        },
        {
          name: "LND2",
          type: ["offchain"],
          priority: 3,
        },
      ],
    },
    onChainWallet: {
      type: "object",
      properties: {
        dustThreshold: { type: "integer" },
        minConfirmations: { type: "integer" },
        scanDepth: { type: "integer" }, // TODO: improve naming
        scanDepthOutgoing: { type: "integer" },
        scanDepthChannelUpdate: { type: "integer" },
      },
      required: [
        "dustThreshold",
        "minConfirmations",
        "scanDepth",
        "scanDepthOutgoing",
        "scanDepthChannelUpdate",
      ],
      additionalProperties: false,
      default: {
        dustThreshold: 5000,
        minConfirmations: 2,
        scanDepth: 360,
        scanDepthOutgoing: 2,
        scanDepthChannelUpdate: 8,
      },
    },
    swap: {
      type: "object",
      properties: {
        loopOutWhenHotWalletLessThan: { type: "integer" },
        lnd1loopRestEndpoint: { type: "string" },
        lnd2loopRestEndpoint: { type: "string" },
        lnd1loopRpcEndpoint: { type: "string" },
        lnd2loopRpcEndpoint: { type: "string" },
        swapOutAmount: { type: "integer" },
        swapProviders: {
          type: "array",
          items: { enum: ["Loop"] },
          uniqueItems: true,
        },
      },
      default: {
        loopOutWhenHotWalletLessThan: 200000000,
        swapOutAmount: 50000000,
        swapProviders: ["Loop"],
        lnd1loopRestEndpoint: "https://localhost:8081",
        lnd1loopRpcEndpoint: "localhost:11010",
        lnd2loopRestEndpoint: "https://localhost:8082",
        lnd2loopRpcEndpoint: "localhost:11011",
      },
    },
    apollo: {
      type: "object",
      properties: {
        playground: { type: "boolean" },
        playgroundUrl: { type: "string" },
      },
      required: ["playground"],
      if: {
        properties: { playground: { const: true } },
      },
      then: { required: ["playgroundUrl"] },
      additionalProperties: false,
      default: {
        playground: true,
        playgroundUrl: "https://api.staging.galoy.io/graphql",
      },
    },
    userActivenessMonthlyVolumeThreshold: { type: "integer", default: 100 },
    cronConfig: {
      type: "object",
      properties: {
        rebalanceEnabled: { type: "boolean" },
        swapEnabled: { type: "boolean" },
      },
      required: ["rebalanceEnabled", "swapEnabled"],
      additionalProperties: false,
      default: {
        rebalanceEnabled: true,
        swapEnabled: true,
      },
    },
    kratosConfig: {
      type: "object",
      properties: {
        publicApi: { type: "string" },
        adminApi: { type: "string" },
        corsAllowedOrigins: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
      },
      required: ["publicApi", "adminApi", "corsAllowedOrigins"],
      additionalProperties: false,
      default: {
        publicApi: "http://localhost:4433",
        adminApi: "http://localhost:4434",
        corsAllowedOrigins: ["http://localhost:3000"],
      },
    },
    oathkeeperConfig: {
      type: "object",
      properties: {
        urlJkws: { type: "string" },
        decisionsApi: { type: "string" },
      },
      required: ["urlJkws", "decisionsApi"],
      additionalProperties: false,
      default: {
        urlJkws: `http://${
          process.env.OATHKEEPER_HOST ?? "oathkeeper"
        }:4456/.well-known/jwks.json`,
        decisionsApi: `http://${
          process.env.OATHKEEPER_HOST ?? "oathkeeper"
        }:4456/decisions/`,
      },
    },
    captcha: {
      type: "object",
      properties: {
        mandatory: { type: "boolean" },
      },
      required: ["mandatory"],
      additionalProperties: false,
      default: { mandatory: false },
    },
    skipFeeProbe: {
      type: "array",
      items: { type: "string", maxLength: 66, minLength: 66 },
      uniqueItems: true,
      default: [
        "038f8f113c580048d847d6949371726653e02b928196bad310e3eda39ff61723f6", // Muun
      ],
    },
  },
  required: [
    "name",
    "buildVersion",
    "coldStorage",
    "lndScbBackupBucketName",
    "rateLimits",
    "accountLimits",
    "spamLimits",
    "ipRecording",
    "fees",
    "lnds",
    "onChainWallet",
    "userActivenessMonthlyVolumeThreshold",
    "cronConfig",
    "kratosConfig",
    "captcha",
  ],
  additionalProperties: false,
} as const
