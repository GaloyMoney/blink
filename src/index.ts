import * as admin from 'firebase-admin'
admin.initializeApp()

module.exports = {
    ...require("./fiat"),
    ...require("./exchange"),
    ...require("./lightning"),
    ...require("./user"),
    ...require("./globalSettings"),
}
