import { setupMongoConnection, User } from "./mongodb";
import { AdminWallet } from "./LightningAdminImpl"

const main = async () => {

	const adminWallet = new AdminWallet()

	await adminWallet.updateEscrows()
    await adminWallet.updateUsersPendingPayment()

}

setupMongoConnection().then(() => main()).catch((err) => console.log(err))