// Based on https://github.com/GeeTeam/gt3-server-node-express-bypass/blob/master/app.js

// https://docs.geetest.com/captcha/apirefer/api/server
// doing this: "If the storage space is not sufficient: Send request to check bypass status before starting the verfication process."

const axios = require("axios")
// const asyncRedis = require("async-redis");

const GeetestConfig = require("./geetest_config")
const GeetestLib = require("./sdk/geetest_lib")

// const client = asyncRedis.createClient({"host":GeetestConfig.REDIS_HOST, "port":GeetestConfig.REDIS_PORT});

async function sendRequest(params) {
  const request_url = GeetestConfig.BYPASS_URL
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

function sleep() {
  return new Promise((resolve) => {
    setTimeout(resolve, GeetestConfig.CYCLE_TIME * 1000)
  })
}

// async function checkBypassStatus(){
//         let bypass_status;
//         while(true){
//             bypass_status = await sendRequest({"gt":GeetestConfig.GEETEST_ID});
//             if (bypass_status === "success"){
//                 client.set(GeetestConfig.GEETEST_BYPASS_STATUS_KEY, bypass_status);
//             }
//             else{
//                 bypass_status = "fail"
//                 client.set(GeetestConfig.GEETEST_BYPASS_STATUS_KEY, bypass_status);
//             }
//             console.log(bypass_status)
//             await sleep();
//         }
// }
// checkBypassStatus()

async function getBypassStatus() {
  const bypass_status = await sendRequest({ gt: GeetestConfig.GEETEST_ID })
  return bypass_status
  // if (bypass_status === "success"){
  //     client.set(GeetestConfig.GEETEST_BYPASS_STATUS_KEY, bypass_status);
  // }
  // else{
  //     bypass_status = "fail"
  //     client.set(GeetestConfig.GEETEST_BYPASS_STATUS_KEY, bypass_status);
  // }
  //
  // OR "" (empty => error in sendRequest)
}

async function register() {
  const gtLib = new GeetestLib(GeetestConfig.GEETEST_ID, GeetestConfig.GEETEST_KEY)
  const digestmod = "md5"
  const userId = "test"
  const params = {
    digestmod: digestmod,
    user_id: userId,
    client_type: "web",
    ip_address: "127.0.0.1",
  }

  // const bypasscache = await client.get(GeetestConfig.GEETEST_BYPASS_STATUS_KEY);
  const bypasscache = await getBypassStatus() // not a cache

  let result
  if (bypasscache === "success") {
    result = await gtLib.register(digestmod, params)
  } else {
    result = await gtLib.localRegister()
  }
  return JSON.parse(result.data)
}

async function validate(challenge, validate, seccode) {
  const gtLib = new GeetestLib(GeetestConfig.GEETEST_ID, GeetestConfig.GEETEST_KEY)
  //   const challenge = req.body[GeetestLib.GEETEST_CHALLENGE]
  //   const validate = req.body[GeetestLib.GEETEST_VALIDATE]
  //   const seccode = req.body[GeetestLib.GEETEST_SECCODE]

  // const bypasscache = await client.get(GeetestConfig.GEETEST_BYPASS_STATUS_KEY);
  // TODO? Keep it in memory? is a single value... or use redis
  const bypasscache = await getBypassStatus() // not a cache

  let result
  var params = new Array()
  if (bypasscache === "success") {
    result = await gtLib.successValidate(challenge, validate, seccode, params)
  } else {
    result = gtLib.failValidate(challenge, validate, seccode)
  }
  return result
}

module.exports = { register, validate }
