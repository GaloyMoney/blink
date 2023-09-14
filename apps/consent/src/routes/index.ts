// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import express from "express"
// import { hydraClient } from "../config"

const router = express.Router()

router.get("/", (req, res) => {
  res.render("index")
})

// hydraClient
//   .getOAuth2LoginRequest({ })
//   .then((response) => {
//     console.log(response.data)
//   })

export default router
