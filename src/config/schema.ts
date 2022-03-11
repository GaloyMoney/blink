import { JTDDataType } from "ajv/dist/types/jtd-schema"

export type ConfigSchema = JTDDataType<typeof configSchema>

const buildNumberConfigSchema = {
  type: "object",
  properties: {
    minBuildNumber: { type: "number" },
    lastBuildNumber: { type: "number" },
  },
  required: ["minBuildNumber", "lastBuildNumber"],
  additionalProperties: false,
}

const accountLimitConfigSchema = {
  type: "object",
  properties: {
    level: {
      type: "object",
      properties: {
        1: { type: "number" },
        2: { type: "number" },
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
    points: { type: "number" },
    duration: { type: "number" },
    blockDuration: { type: "number" },
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
    priority: { type: "number" },
  },
  required: ["name", "type", "priority"],
  additionalProperties: false,
}

export const configSchema = {
  type: "object",
  properties: {
    PROXY_CHECK_APIKEY: { type: "string" },
    name: { type: "string" },
    funder: { type: "string" },
    buildVersion: {
      type: "object",
      properties: {
        android: buildNumberConfigSchema,
        ios: buildNumberConfigSchema,
      },
      required: ["ios", "android"],
    },
    quotes: { type: "array", items: { type: "string" }, uniqueItems: true },
    coldStorage: {
      type: "object",
      properties: {
        minOnChainHotWalletBalance: { type: "number" },
        minRebalanceSize: { type: "number" },
        maxHotWalletBalance: { type: "number" },
        walletPattern: { type: "string" },
        onChainWallet: { type: "string" },
        targetConfirmations: { type: "number" },
      },
      required: [
        "minOnChainHotWalletBalance",
        "minRebalanceSize",
        "maxHotWalletBalance",
        "walletPattern",
        "targetConfirmations",
      ],
      additionalProperties: false,
    },
    lndScbBackupBucketName: { type: "string" },
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
    },
    accountLimits: {
      type: "object",
      properties: {
        withdrawal: accountLimitConfigSchema,
        intraLedger: accountLimitConfigSchema,
      },
      required: ["withdrawal", "intraLedger"],
      additionalProperties: false,
    },
    spamLimits: {
      type: "object",
      properties: {
        memoSharingSatsThreshold: { type: "number" },
      },
      required: ["memoSharingSatsThreshold"],
      additionalProperties: false,
    },
    twoFALimits: {
      type: "object",
      properties: {
        threshold: { type: "number" },
      },
      required: ["threshold"],
      additionalProperties: false,
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
    },
    fees: {
      type: "object",
      properties: {
        withdraw: { type: "number" },
        deposit: { type: "number" },
      },
      required: ["withdraw", "deposit"],
      additionalProperties: false,
    },
    withdrawFeeRange: {
      type: "object",
      properties: {
        min: { type: "number" },
        max: { type: "number" },
      },
      required: ["min", "max"],
      additionalProperties: false,
    },
    lnds: {
      type: "array",
      items: lndConfig,
      uniqueItems: true,
    },
    onChainWallet: {
      type: "object",
      properties: {
        dustThreshold: { type: "number" },
        minConfirmations: { type: "number" },
        scanDepth: { type: "number" },
        scanDepthOutgoing: { type: "number" },
        scanDepthChannelUpdate: { type: "number" },
      },
      required: [
        "dustThreshold",
        "minConfirmations",
        "scanDepth",
        "scanDepthOutgoing",
        "scanDepthChannelUpdate",
      ],
      additionalProperties: false,
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
    },
    userActivenessMonthlyVolumeThreshold: { type: "number" },
    cronConfig: {
      type: "object",
      properties: {
        rebalanceEnabled: { type: "boolean" },
      },
      required: ["rebalanceEnabled"],
      additionalProperties: false,
    },
    kratosConfig: {
      type: "object",
      properties: {
        serverURL: { type: "string" },
        corsAllowedOrigins: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
      },
      required: ["serverURL", "corsAllowedOrigins"],
      additionalProperties: false,
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
    "twoFALimits",
    "ipRecording",
    "fees",
    "withdrawFeeRange",
    "lnds",
    "onChainWallet",
    "userActivenessMonthlyVolumeThreshold",
    "cronConfig",
    "kratosConfig",
  ],
  additionalProperties: false,
} as const
