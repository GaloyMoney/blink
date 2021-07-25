// Based on https://github.com/GeeTeam/gt3-server-node-express-bypass/blob/master/app.js

// https://docs.geetest.com/captcha/apirefer/api/server
// doing this: "If the storage space is not sufficient: Send request to check bypass status before starting the verfication process."

// const express = require('express');
const axios = require("axios")
// const asyncRedis = require("async-redis");

const GeetestConfig = require("./geetest_config")
const GeetestLib = require("./sdk/geetest_lib")

// const app = express()
// app.use(express.static('public'));
// app.use(express.urlencoded({extended: true}))

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

// app.get("/", function (req, res) {
//     res.redirect("/index.html");
// })

// // 验证初始化接口，GET请求
// app.get("/register", async function (req, res) {
//     /*
//     必传参数
//         digestmod 此版本sdk可支持md5、sha256、hmac-sha256，md5之外的算法需特殊配置的账号，联系极验客服
//     自定义参数,可选择添加
//         user_id 客户端用户的唯一标识，确定用户的唯一性；作用于提供进阶数据分析服务，可在register和validate接口传入，不传入也不影响验证服务的使用；若担心用户信息风险，可作预处理(如哈希处理)再提供到极验
//         client_type 客户端类型，web：电脑上的浏览器；h5：手机上的浏览器，包括移动应用内完全内置的web_view；native：通过原生sdk植入app应用的方式；unknown：未知
//         ip_address 客户端请求sdk服务器的ip地址
//      */
//     const gtLib = new GeetestLib(GeetestConfig.GEETEST_ID, GeetestConfig.GEETEST_KEY);
//     const digestmod = "md5";
//     const userId = "test";
//     const params = {"digestmod": digestmod, "user_id": userId, "client_type": "web", "ip_address": "127.0.0.1"}
//     const bypasscache = await client.get(GeetestConfig.GEETEST_BYPASS_STATUS_KEY);
//     let result;
//     if (bypasscache === "success"){
//         result = await gtLib.register(digestmod, params);
//     }else{
//         result = await gtLib.localRegister();
//     }
//     res.set('Content-Type', 'application/json;charset=UTF-8')
//     return res.send(result.data);
// })

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
  // res.set('Content-Type', 'application/json;charset=UTF-8')
  // return res.send(result.data);
  console.log(`result: ${JSON.stringify(result)}`)
  return JSON.parse(result.data)
}

// // 二次验证接口，POST请求
// app.post("/validate", async function (req, res) {
//     const gtLib = new GeetestLib(GeetestConfig.GEETEST_ID, GeetestConfig.GEETEST_KEY);
//     const challenge = req.body[GeetestLib.GEETEST_CHALLENGE];
//     const validate = req.body[GeetestLib.GEETEST_VALIDATE];
//     const seccode = req.body[GeetestLib.GEETEST_SECCODE];
//     const bypasscache = await client.get(GeetestConfig.GEETEST_BYPASS_STATUS_KEY);
//     let result;
//     var params = new Array();
//     if (bypasscache === "success"){
//         result = await gtLib.successValidate(challenge, validate, seccode, params);
//     } else {
//         result = gtLib.failValidate(challenge, validate, seccode);
//     }
//     // 注意，不要更改返回的结构和值类型
//     if (result.status === 1) {
//         return res.json({"result": "success", "version": GeetestLib.VERSION});
//     } else {
//         return res.json({"result": "fail", "version": GeetestLib.VERSION, "msg": result.msg});
//     }
// })

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
  // // // 注意，不要更改返回的结构和值类型
  // // if (result.status === 1) {
  // //     return res.json({"result": "success", "version": GeetestLib.VERSION});
  // // } else {
  // //     return res.json({"result": "fail", "version": GeetestLib.VERSION, "msg": result.msg});
  // // }
  // //
  // // return (result.status === 1)
  // return true
  return result
}

// app.listen(3333)

// module.exports.register = register;
// module.exports.validate = validate;

module.exports = { register, validate }
