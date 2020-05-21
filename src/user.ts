import { checkAuth, checkNonAnonymous } from "./utils";
import * as functions from 'firebase-functions'
import { transactions_template } from "./const"
import * as admin from 'firebase-admin'
import { setupMongoose } from "./db"
import { LightningWalletAuthed } from "./LightningUserWallet";
const firestore = admin.firestore()

exports.addEarn = functions.https.onCall(async (data, context) => {
    checkNonAnonymous(context)
    const wallet = new LightningWalletAuthed({uid: context.auth?.uid})
    await wallet.addEarn({hash: data})
})

// for notification
exports.sendDeviceToken = functions.https.onCall(async (data, context) => {
  checkAuth(context)

  return firestore.doc(`/users/${context.auth!.uid}`).set({
      deviceToken: data.deviceToken}, { merge: true }
  ).then(writeResult => {
      return {result: `Transaction succesfully added ${writeResult}`}
  })
  .catch((err) => {
      console.error(err)
      throw new functions.https.HttpsError('internal', err)
  })
})

exports.onUserCreation = functions.auth.user().onCreate(async (user) => {
  //TODO clean up returns

  const prepopulate = false
  const lookup = false

  let transactions: any[] // FIXME

  if (prepopulate) {
      transactions = transactions_template.filter((item) => Math.random() > 0.5 )
  } else {
      transactions = []
  }

  try {
      const result = await firestore.doc(`/users/${user.uid}`).set(
          { transactions },
          { merge: true }
      )
      console.log(`Transaction succesfully added ${result}`)
  } catch (err) {
      console.error(err)
      throw new functions.https.HttpsError('internal', err)
  }

  if (lookup) {

      const { getTwilioClient } = require("./text")

      const phoneNumber = (await admin.auth().getUser(user.uid)).phoneNumber
      console.log(phoneNumber)

      const callerInfo = await getTwilioClient().lookups.phoneNumbers(phoneNumber)
                              .fetch({type: ['caller-name', 'carrier']})

      const twilio = JSON.parse(JSON.stringify(callerInfo)) // FIXME hacky?

      return firestore.doc(`/users/${user.uid}`).set({ twilio }, { merge: true }
      ).then(writeResult => {
          return {result: `Transaction succesfully added ${writeResult}`}
      })
      .catch((err) => {
          console.error(err)
          throw new functions.https.HttpsError('internal', err)
      })
  }

  return {'result': 'success'}
})

exports.test = functions.https.onCall(async (data, context) => {
  console.log(context)
})


exports.deleteCurrentUser = functions.https.onCall(async (data, context) => {
  try {
      await admin.auth().deleteUser(context.auth!.uid)
      return {'result': 'success'}
  } catch(err) {
      throw new functions.https.HttpsError('internal', err)
  }
})

exports.deleteAllUsers = functions.https.onCall(async (data, context) => {
  return admin.auth().listUsers()
  .then(listUsers => {
      for (const user of listUsers.users) {
          admin.auth().deleteUser(user.uid)
          .catch(err => err)
      }

      const collectionDeleted = deleteCollection(firestore, 'users', 50)
      
      return {userDeleted: listUsers.users, collectionDeleted}
  })
  .catch(err => {
      throw new functions.https.HttpsError('internal', err)
  })
})


const deleteCollection = async (db: any, collectionPath: any, batchSize: any) => {
  let collectionRef = db.collection(collectionPath);
  let query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}

function deleteQueryBatch(db: any, query: any, batchSize: any, resolve: any, reject: any) {
  query.get()
  .then((snapshot: any) => {
  // When there are no documents left, we are done
  if (snapshot.size == 0) {
      return 0;
  }

  // Delete documents in a batch
  let batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
  });

  return batch.commit().then(() => {
      return snapshot.size;
  });
  }).then((numDeleted: any) => {
  if (numDeleted === 0) {
      resolve();
      return;
  }

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
      deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
  })
  .catch(reject);
}
