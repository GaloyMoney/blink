// upgrade #1

// node: it may not make so much sense to attach user to phone id

import { Transaction, User } from "./mongodb";
await User.updateMany({}, {$set: {currency: "BTC"}})
await Transaction.updateMany({type: "earn"}, {$set: {type: "on_us"}})

// TODO: db version: 1

