export class ConfigError<T> extends Error {
  data?: T
  name = this.constructor.name
  constructor(message?: string, data?: T) {
    super(message)
    this.data = data
  }
}

export class MissingBankOwnerConfigError<T> extends ConfigError<T> {}
export class MissingBankOwnerAccountConfigError<
  T,
> extends MissingBankOwnerConfigError<T> {}

export class MissingDealerConfigError<T> extends ConfigError<T> {}
export class MissingDealerAccountConfigError<T> extends MissingDealerConfigError<T> {}
export class MissingBtcDealerWalletConfigError<T> extends MissingDealerConfigError<T> {}
export class MissingUsdDealerWalletConfigError<T> extends MissingDealerConfigError<T> {}

export class MissingFunderConfigError<T> extends ConfigError<T> {}
export class MissingFunderAccountConfigError<T> extends MissingFunderConfigError<T> {}

export class UnknownConfigError<T> extends ConfigError<T> {}
