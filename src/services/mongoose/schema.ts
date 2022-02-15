import crypto from "crypto"

import { getFeeRates, getTwoFAConfig, levels } from "@config"
import { UsernameRegex } from "@domain/accounts"
import { WalletCurrency, WalletIdRegex, WalletType } from "@domain/wallets"
import * as mongoose from "mongoose"

import { WalletRecord } from "./wallets"

// TODO migration:
// rename InvoiceUser collection to walletInvoice

// mongoose.set("debug", true)

const Schema = mongoose.Schema

const dbMetadataSchema = new Schema({
  routingFeeLastEntry: Date, // TODO: rename to routingRevenueLastEntry
})
export const DbMetadata = mongoose.model("DbMetadata", dbMetadataSchema)

const walletInvoiceSchema = new Schema({
  _id: String, // hash of invoice
  walletId: {
    required: true,
    type: String,
    validate: {
      validator: function (v) {
        return v.match(WalletIdRegex)
      },
    },
  },

  // Usd quote. sats is attached in the invoice directly.
  // this is the option price given by the dealer
  // is optional, BTC wallet or invoice on USD with no amount doesn't have cents
  cents: {
    type: Number,
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value",
    },
  },

  currency: {
    required: true,
    type: String,
    enum: Object.values(WalletCurrency),
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },

  selfGenerated: {
    type: Boolean,
    default: true,
  },

  pubkey: {
    type: String,
    required: true,
  },

  paid: {
    type: Boolean,
    default: false,
  },
})

walletInvoiceSchema.index({ walletId: 1, paid: 1 })

export const WalletInvoice = mongoose.model("InvoiceUser", walletInvoiceSchema)

const feeRates = getFeeRates()

const twoFAConfig = getTwoFAConfig()

const WalletSchema = new Schema<WalletRecord>({
  id: {
    type: String,
    index: true,
    unique: true,
    required: true,
    default: () => crypto.randomUUID(),
  },
  _accountId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  type: {
    type: String,
    enum: Object.values(WalletType),
    required: true,
    default: WalletType.Checking,
  },
  currency: {
    type: String,
    enum: Object.values(WalletCurrency),
    required: true,
    default: WalletCurrency.Btc,
  },
  onchain: {
    type: [
      {
        pubkey: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          // TODO: index?
          required: true,
        },
      },
    ],
    default: [],
  },
})

export const Wallet = mongoose.model("Wallet", WalletSchema)

const UserSchema = new Schema<UserRecord>(
  {
    depositFeeRatio: {
      type: Number,
      default: feeRates.depositFeeVariable,
      min: 0,
      max: 1,
    },
    withdrawFee: {
      type: Number,
      default: feeRates.withdrawFeeFixed,
      min: 0,
    },
    lastConnection: Date,
    lastIPs: {
      type: [
        {
          ip: String,
          provider: String,
          country: String,
          region: String,
          city: String,
          //using Type instead of type due to its special status in mongoose
          Type: String,
          firstConnection: {
            type: Date,
            default: Date.now,
          },
          lastConnection: Date,
        },
      ],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    earn: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      // FIXME: role is a mix between 2 things here
      // there can be many users and editors
      // there can be only one dealer, bankowner and funder
      // so we may want different property to differentiate those
      enum: ["user", "editor", "dealer", "bankowner", "funder"],
      required: true,
      default: "user",
      // TODO : enfore the fact there can be only one dealer/bankowner/funder
    },

    level: {
      type: Number,
      enum: levels,
      default: 1,
    },

    // TODO: refactor, have phone and twilio metadata in the same sub-object.
    phone: {
      // TODO we should store country as a separate string
      type: String,
      required: true,
      unique: true,
    },
    twilio: {
      // TODO: rename to PhoneMetadata
      carrier: {
        error_code: String, // check this is the right syntax
        mobile_country_code: String,
        mobile_network_code: String,
        name: String,
        type: {
          types: String,
          enum: ["landline", "voip", "mobile"],
        },
      },
      countryCode: String,
    },

    username: {
      type: String,
      match: [UsernameRegex, "Username can only have alphabets, numbers and underscores"],
      minlength: 3,
      maxlength: 50,
      index: {
        unique: true,
        collation: { locale: "en", strength: 2 },
        partialFilterExpression: { username: { $type: "string" } },
      },
    },
    deviceToken: {
      type: [String],
      default: [],
    },
    contacts: {
      type: [
        {
          id: {
            type: String,
            collation: { locale: "en", strength: 2 },
          },
          name: {
            type: String,
            // TODO: add constraint here
          },
          transactionsCount: {
            type: Number,
            default: 1,
          },
        },
      ],
      default: [],
    },
    language: {
      type: String,
      enum: ["en", "es", ""],
      default: "",
    },
    // firstName,
    // lastName,
    // activated,
    // etc

    title: {
      type: String,
      minlength: 3,
      maxlength: 100,
    },
    coordinates: {
      type: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
    },

    status: {
      type: String,
      enum: ["active", "locked"],
      default: "active",
    },

    twoFA: {
      secret: {
        type: String,
      },
      threshold: {
        type: Number,
        default: twoFAConfig.threshold,
      },
    },

    defaultWalletId: {
      type: String,
      index: true,
    },
  },
  { id: false },
)

UserSchema.index({
  title: 1,
  coordinates: 1,
})

export const User = mongoose.model<UserRecord>("User", UserSchema)

// TODO: this DB should be capped.
const PhoneCodeSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  phone: {
    // TODO we should store country as a separate string
    type: String,
    required: true,
  },
  code: {
    type: Number,
    required: true,
  },
})

export const PhoneCode = mongoose.model("PhoneCode", PhoneCodeSchema)

const accountApiKeySchema = new Schema({
  accountId: { type: String, index: true, required: true },
  label: { type: String, required: true },
  hashedKey: { type: String, unique: true, required: true },
  enabled: { type: Boolean, default: true },
  expireAt: { type: Date, required: true },
  timestamp: { type: Date, default: Date.now },
})

accountApiKeySchema.index({ accountId: 1, label: 1 }, { unique: true })
export const AccountApiKey = mongoose.model("AccountApiKey", accountApiKeySchema)
