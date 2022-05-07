import express from 'express';
import axios from 'axios'
import crypto from 'crypto'
import 'dotenv/config'
console.log(process.env) //
const router = express.Router();

const secret:any = process.env.API_SECRET


router.post('/neworder', async (req, res) => {
  try {
    let {
      side ,
      order_type,
      market,
      price_per_unit,
      total_quantity
     } = req.body;
      
    const timeStamp = Math.floor(Date.now());
    const order_body = {
      "side": side,
      "order_type": order_type,
      "market": market,
      "price_per_unit": price_per_unit,
      "total_quantity": total_quantity,
      "timestamp": timeStamp,

    }
    const payload = Buffer.from(JSON.stringify(order_body)).toString();
    const api_sign = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const api_key = process.env.API_KEY;

    console.log(order_body)
    let order_details = await createOrder(api_key, api_sign, order_body)

    if (order_details && order_details.success === true) {
      return res.status(200).send(order_details)
    }else{
      return res.status(400).send(order_details)
    }
   
  } catch (err) {
    return res.status(500).send({ success: false, error: err })
  }

})

export default router;


let createOrder = async (api_key, api_sign, order_data) => {
  var data = JSON.stringify(order_data);

  var config: any = {
    method: 'post',
    url: 'https://api.coindcx.com/exchange/v1/orders/create',
    headers: {
      'X-AUTH-APIKEY': api_key,
      'X-AUTH-SIGNATURE': api_sign,
      'Content-Type': 'application/json'
    },
    data: data
  };
  console.log("--config---", config);
  try {
    let { data } = await axios(config);
    console.log("response", data);
    return { success: true, data: data };

  } catch (err) {
    const error = err && err.response && err.response.data ? err.response.data : err;
    console.log("error", error);
    return { success: false, error: error };

  }
}