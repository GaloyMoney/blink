export class ConfigError<T> extends Error {
  data?: T
  name = this.constructor.name
  constructor(message?: string, data?: T) {
    super(message)
    this.data = data
  }
}
