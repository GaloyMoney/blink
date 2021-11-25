export class GeetestError extends Error {
  name = this.constructor.name
}

export class GeetestUserFailToPassError extends GeetestError {}
export class UnknownGeetestError extends GeetestError {}
