export class TwilioClient {
  async sendText() {
    return new Promise((resolve) => resolve(true))
  }

  async getCarrier() {
    return new Promise((resolve) => resolve(null))
  }
}
