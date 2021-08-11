// Based on https://github.com/GeeTeam/gt3-server-node-express-bypass/blob/master/app.js

// https://docs.geetest.com/captcha/apirefer/api/server
// doing this: "If the storage space is not sufficient: Send request to check bypass status before starting the verfication process."

import axios from "axios"
import GeetestLib from "gt3-server-node-express-sdk/sdk/geetest_lib" // galoy fork

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

const GeeTest = (config): GeeTestType => {
  const getBypassStatus = async () => {
    const bypass_status = await sendRequest({ gt: config.id })
    return bypass_status
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
