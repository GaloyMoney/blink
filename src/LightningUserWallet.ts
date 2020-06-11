import { book } from "medici";
import moment from "moment";
import { LightningMixin } from "./Lightning";
import { LightningAdminWallet } from "./LightningAdminImpl";
import { ILightningTransaction, OnboardingEarn, TransactionType } from "./types";
import { getAuth } from "./utils";
import { UserWallet } from "./wallet";
const lnService = require('ln-service');
const util = require('util')
const mongoose = require("mongoose");



/**
 * this represents a user wallet
 */
export class LightningUserWallet extends LightningMixin(UserWallet) {
    constructor({uid}: {uid: string}) {
        super({uid})
    }

    async addEarn(ids) {
        // TODO move out lightningUser
        // TODO FIXME XXX: this function is succeptible to race condition.
        // add a lock or db-level transaction to prevent this
        // we could use something like this: https://github.com/chilts/mongodb-lock
        
        const lightningAdminWallet = new LightningAdminWallet({uid: "admin"})
        const User = mongoose.model("User")

        const result: object[] = []

        for (const id of ids) {
            const amount = OnboardingEarn[id]

            const userPastState = await User.findOneAndUpdate(
                {_id: this.uid}, 
                { $push: { earn: id } },
                { upsert: true} 
            )
    
            if ((userPastState.earn?.findIndex(item => item === id) ?? -1 ) === -1) {
                await lightningAdminWallet.addFunds({amount, uid: this.uid, memo: id, type: "earn"})
            }
    
            result.push({id, completed: true})
        }

        return result
    }

    async setLevel({level}) {
        // FIXME this should be in User and not tight to Lightning // use Mixins instead
        const User = mongoose.model("User")
        return await User.findOneAndUpdate({_id: this.uid}, {level}, {new: true, upsert: true} )
    }
}