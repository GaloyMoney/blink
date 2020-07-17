import { LightningAdminWallet } from "../LightningAdminImpl"
const mongoose = require("mongoose")
const User = mongoose.model("User")


export const checkIsBalanced = async () => {
	const admin = await User.findOne({ role: "admin" })
	const adminWallet = new LightningAdminWallet({ uid: admin._id })
	const { assetsEqualLiabilities, lndBalanceSheetAreSynced } = await adminWallet.balanceSheetIsBalanced()
	expect(assetsEqualLiabilities).toBeTruthy()
	expect(lndBalanceSheetAreSynced).toBeTruthy()
}