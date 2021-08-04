// Based on https://github.com/GeeTeam/gt3-server-node-express-bypass/blob/master/app.js

// https://docs.geetest.com/captcha/apirefer/api/server
// doing this: "If the storage space is not sufficient: Send request to check bypass status before starting the verfication process."

const axios = require("axios")
const GeetestLib = require("gt3-server-node-express-sdk/sdk/geetest_lib") // galoy fork

async function sendRequest(params) {
  const request_url = "http://bypass.geetest.com/v1/bypass_status.php"
  let bypass_res
  try {
    const res = await axios({
      url: request_url,
      method: "GET",
      timeout: 5000,
      params: params,
    })
    const resBody = res.status === 200 ? res.data : ""
    console.log(resBody)
    bypass_res = resBody["status"]
  } catch (e) {
    bypass_res = ""
  }
  return bypass_res
}

class GeeTest {
  constructor(GEETEST_ID, GEETEST_KEY) {
    this.GEETEST_ID = GEETEST_ID
    this.GEETEST_KEY = GEETEST_KEY
  }

  // private
  async _getBypassStatus() {
    const bypass_status = await sendRequest({ gt: this.GEETEST_ID })
    return bypass_status
  }

  async register() {
    const gtLib = new GeetestLib(this.GEETEST_ID, this.GEETEST_KEY)
    const digestmod = "md5"
    const userId = "test"
    const params = {
      digestmod: digestmod,
      user_id: userId,
      client_type: "native",
      // client_type: "web",
      ip_address: "127.0.0.1",
    }
    const bypasscache = await this._getBypassStatus() // not a cache
    let result
    if (bypasscache === "success") {
      result = await gtLib.register(digestmod, params)
    } else {
      result = await gtLib.localRegister()
    }
    return JSON.parse(result.data)
  }

  async validate(challenge, validate, seccode) {
    const gtLib = new GeetestLib(this.GEETEST_ID, this.GEETEST_KEY)
    const bypasscache = await this._getBypassStatus() // not a cache
    let result
    var params = new Array()
    if (bypasscache === "success") {
      result = await gtLib.successValidate(challenge, validate, seccode, params)
    } else {
      result = gtLib.failValidate(challenge, validate, seccode)
    }
    return result.status === 1
  }
}

module.exports = GeeTest
