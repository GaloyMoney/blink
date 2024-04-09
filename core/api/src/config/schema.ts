import { AccountStatus } from "@/domain/accounts/primitives"
import { WalletCurrency } from "@/domain/shared"

const displayCurrencyConfigSchema = {
  type: "object",
  properties: {
    code: { type: "string" },
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
        0: { type: "integer" },
        1: { type: "integer" },
        2: { type: "integer" },
      },
      required: ["0", "1", "2"],
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

export const configSchema = {
  type: "object",
  properties: {
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
          minBuildNumber: 362,
          lastBuildNumber: 362,
        },
        ios: {
          minBuildNumber: 362,
          lastBuildNumber: 362,
        },
      },
      required: ["ios", "android"],
      additionalProperties: false,
    },
    quizzes: {
      type: "object",
      properties: {
        enableIpProxyCheck: { type: "boolean" },
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
        "enableIpProxyCheck",
        "allowPhoneCountries",
        "denyPhoneCountries",
        "allowIPCountries",
        "denyIPCountries",
        "allowASNs",
        "denyASNs",
      ],
      additionalProperties: false,
      default: {
        enableIpProxyCheck: true,
        allowPhoneCountries: [],
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
      },
      required: ["minOnChainHotWalletBalance", "minRebalanceSize", "maxHotWalletBalance"],
      additionalProperties: false,
      default: {
        minOnChainHotWalletBalance: 1000000,
        minRebalanceSize: 10000000,
        maxHotWalletBalance: 200000000,
      },
    },
    bria: {
      type: "object",
      properties: {
        hotWalletName: { type: "string" },
        queueNames: {
          type: "object",
          properties: {
            fast: { type: "string" },
          },
          required: ["fast"],
          additionalProperties: false,
          default: {
            fast: "dev-queue",
          },
        },
        coldStorage: {
          type: "object",
          properties: {
            walletName: { type: "string" },
            hotToColdRebalanceQueueName: { type: "string" },
          },
          required: ["walletName", "hotToColdRebalanceQueueName"],
          default: {
            walletName: "cold",
            hotToColdRebalanceQueueName: "dev-queue",
          },
        },
      },
      required: ["hotWalletName", "queueNames", "coldStorage"],
      additionalProperties: false,
      default: {
        hotWalletName: "dev-wallet",
      },
    },
    lndScbBackupBucketName: { type: "string", default: "lnd-static-channel-backups" },
    admin_accounts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          phone: { type: "string" },
        },
        required: ["role", "phone"],
        additionalProperties: false,
      },
      default: [
        {
          role: "dealer",
          phone: "+16505554327",
        },
        {
          role: "funder",
          phone: "+16505554325",
        },
        {
          role: "bankowner",
          phone: "+16505554334",
        },
      ],
      uniqueItems: true,
    },
    test_accounts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          phone: { type: "string" },
          code: { type: "string" },
        },
        required: ["phone", "code"],
        additionalProperties: false,
      },
      default: [],
      uniqueItems: true,
    },
    rateLimits: {
      type: "object",
      properties: {
        requestCodePerLoginIdentifier: rateLimitConfigSchema,
        requestCodePerIp: rateLimitConfigSchema,
        loginAttemptPerLoginIdentifier: rateLimitConfigSchema,
        failedLoginAttemptPerIp: rateLimitConfigSchema,
        invoiceCreateAttempt: rateLimitConfigSchema,
        invoiceCreateForRecipientAttempt: rateLimitConfigSchema,
        onChainAddressCreateAttempt: rateLimitConfigSchema,
        deviceAccountCreateAttempt: rateLimitConfigSchema,
        requestCodePerAppcheckJti: rateLimitConfigSchema,
        addQuizPerIp: rateLimitConfigSchema,
        addQuizPerPhone: rateLimitConfigSchema,
      },
      required: [
        "requestCodePerLoginIdentifier",
        "requestCodePerIp",
        "loginAttemptPerLoginIdentifier",
        "failedLoginAttemptPerIp",
        "invoiceCreateAttempt",
        "invoiceCreateForRecipientAttempt",
        "onChainAddressCreateAttempt",
        "deviceAccountCreateAttempt",
        "requestCodePerAppcheckJti",
        "addQuizPerIp",
        "addQuizPerPhone",
      ],
      additionalProperties: false,
      default: {
        requestCodePerLoginIdentifier: {
          points: 4,
          duration: 3600,
          blockDuration: 10800,
        },
        requestCodePerIp: {
          points: 16,
          duration: 3600,
          blockDuration: 86400,
        },
        loginAttemptPerLoginIdentifier: {
          points: 6,
          duration: 3600,
          blockDuration: 7200,
        },
        failedLoginAttemptPerIp: {
          points: 20,
          duration: 21600,
          blockDuration: 86400,
        },
        invoiceCreateAttempt: {
          points: 60,
          duration: 60,
          blockDuration: 300,
        },
        invoiceCreateForRecipientAttempt: {
          points: 60,
          duration: 60,
          blockDuration: 300,
        },
        onChainAddressCreateAttempt: {
          points: 20,
          duration: 3600,
          blockDuration: 14400,
        },
        deviceAccountCreateAttempt: {
          points: 2,
          duration: 86400,
          blockDuration: 86400,
        },
        requestCodePerAppcheckJti: {
          points: 6,
          duration: 86400,
          blockDuration: 86400,
        },
        addQuizPerIp: {
          points: 50,
          duration: 86400,
          blockDuration: 604800,
        },
        addQuizPerPhone: {
          points: 20,
          duration: 86400,
          blockDuration: 604800,
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
        enablePhoneCheck: { type: "boolean" },
        enableIpCheck: { type: "boolean" },
        enableIpProxyCheck: { type: "boolean" },
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
        maxDeletions: { type: "number", default: 3 },
      },
      required: [
        "initialStatus",
        "initialWallets",
        "enablePhoneCheck",
        "enableIpCheck",
        "enableIpProxyCheck",
        "allowPhoneCountries",
        "denyPhoneCountries",
        "allowIPCountries",
        "denyIPCountries",
        "allowASNs",
        "denyASNs",
        "maxDeletions",
      ],
      additionalProperties: false,
      default: {
        initialStatus: "active",
        initialWallets: ["BTC", "USD"],
        enablePhoneCheck: false,
        enableIpCheck: false,
        enableIpProxyCheck: false,
        allowPhoneCountries: [],
        denyPhoneCountries: [],
        allowIPCountries: [],
        denyIPCountries: [],
        allowASNs: [],
        denyASNs: [],
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
            "0": 12500,
            "1": 100000,
            "2": 5000000,
          },
        },
        intraLedger: {
          level: {
            "0": 12500,
            "1": 200000,
            "2": 5000000,
          },
        },
        tradeIntraAccount: {
          level: {
            "0": 200000,
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
        enabled: false,
        proxyChecking: {
          enabled: false,
        },
      },
    },
    fees: {
      type: "object",
      properties: {
        deposit: {
          type: "object",
          properties: {
            defaultMin: { type: "integer" },
            threshold: { type: "integer" },
            ratioAsBasisPoints: { type: "integer" },
          },
          required: ["defaultMin", "threshold", "ratioAsBasisPoints"],
          additionalProperties: false,
          default: { defaultMin: 3000, threshold: 1000000, ratioAsBasisPoints: 30 },
        },
        withdraw: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["flat", "proportionalOnImbalance"],
            },
            ratioAsBasisPoints: { type: "integer" },
            threshold: { type: "integer" },
            daysLookback: { type: "integer" },
            defaultMin: { type: "integer" },
          },
          required: [
            "method",
            "ratioAsBasisPoints",
            "threshold",
            "daysLookback",
            "defaultMin",
          ],
          additionalProperties: false,
          default: {
            method: "flat",
            defaultMin: 2000,
            ratioAsBasisPoints: 50,
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
          ratioAsBasisPoints: 50,
          threshold: 1000000,
          daysLookback: 30,
        },
        deposit: { defaultMin: 3000, threshold: 1000000, ratioAsBasisPoints: 30 },
      },
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
    userActivenessMonthlyVolumeThreshold: { type: "integer", default: 100 },
    cronConfig: {
      type: "object",
      properties: {
        rebalanceEnabled: { type: "boolean" },
      },
      required: ["rebalanceEnabled"],
      additionalProperties: false,
      default: {
        rebalanceEnabled: true,
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
    skipFeeProbeConfig: {
      type: "object",
      properties: {
        pubkey: {
          type: "array",
          items: { type: "string", maxLength: 66, minLength: 66 },
          uniqueItems: true,
        },
        chanId: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
      default: {
        pubkey: [],
        chanId: [],
      },
    },
    smsAuthUnsupportedCountries: {
      type: "array",
      items: { type: "string" },
      default: [],
    },
    whatsAppAuthUnsupportedCountries: {
      type: "array",
      items: { type: "string" },
      default: [],
    },
  },
  required: [
    "lightningAddressDomain",
    "lightningAddressDomainAliases",
    "locale",
    "displayCurrency",
    "funder",
    "dealer",
    "ratioPrecision",
    "buildVersion",
    "quizzes",
    "coldStorage",
    "bria",
    "lndScbBackupBucketName",
    "admin_accounts",
    "test_accounts",
    "rateLimits",
    "accounts",
    "accountLimits",
    "spamLimits",
    "ipRecording",
    "fees",
    "onChainWallet",
    "userActivenessMonthlyVolumeThreshold",
    "cronConfig",
    "captcha",
    "skipFeeProbeConfig",
    "smsAuthUnsupportedCountries",
    "whatsAppAuthUnsupportedCountries",
  ],
  additionalProperties: false,
} as const
