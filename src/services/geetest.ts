// Based on https://github.com/GeeTeam/gt3-server-node-express-bypass/blob/master/app.js

// https://docs.geetest.com/captcha/apirefer/api/server
// doing this: "If the storage space is not sufficient: Send request to check bypass status before starting the verfication process."

import axios from "axios"
import GeetestLib from "gt3-server-node-express-sdk/sdk/geetest_lib" // galoy fork

async function sendRequest(params) {
  const requestUrl = "https://bypass.geetest.com/v1/bypass_status.php"
  let bypassRes
  try {
    const res = await axios({
      url: requestUrl,
      method: "GET",
      timeout: 5000,
      params: params,
    })
    const resBody = res.status === 200 ? res.data : ""
    bypassRes = resBody["status"]
  } catch (e) {
    bypassRes = ""
  }
  return bypassRes
}

const GeeTest = (config): GeeTestType => {
  const getBypassStatus = async () => {
    return sendRequest({ gt: config.id })
  }

  const register = async () => {
    const gtLib = new GeetestLib(config.id, config.key)
    const digestmod = "md5"
    const params = {
      digestmod,
      client_type: "native",
    }
    const bypasscache = await getBypassStatus() // not a cache
    let result
    if (bypasscache === "success") {
      result = await gtLib.register(digestmod, params)
    } else {
      result = await gtLib.localRegister()
    }
    return JSON.parse(result.data)
  }

  const validate = async (challenge, validate, seccode) => {
    const gtLib = new GeetestLib(config.id, config.key)
    const bypasscache = await getBypassStatus() // not a cache
    let result
    const params = []
    if (bypasscache === "success") {
      result = await gtLib.successValidate(challenge, validate, seccode, params)
    } else {
      result = gtLib.failValidate(challenge, validate, seccode)
    }
    return result.status === 1
  }

  return { register, validate }
}

export default GeeTest
