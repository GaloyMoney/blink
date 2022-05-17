import {
  BTC_NETWORK,
  DropboxAccessToken,
  GcsApplicationCredentials,
  LND_SCB_BACKUP_BUCKET_NAME,
  Nextcloudurl,
  Nextclouduser,
  Nextcloudpassword
} from "@config"
import { Storage } from "@google-cloud/storage"
import axios, { Axios } from "axios";

export const uploadBackup =
  (logger: Logger) =>
  async ({ backup, pubkey }) => {
    logger.debug({ backup }, "updating scb on dbx")
    const filename = `${BTC_NETWORK}_lnd_scb_${pubkey}_${Date.now()}`
if(!DropboxAccessToken){
  logger.debug("No Dropbox token defined - skipping scb backup")
}else{
  try {
    await axios.post(`https://content.dropboxapi.com/2/files/upload`,backup,{
      headers: { "Authorization" : `Bearer ${DropboxAccessToken}`,
      "Content-Type" : `Application/octet-stream`,
      "Dropbox-API-Arg" : `{"autorename":false,"mode":"add","mute":true,"path":"/${filename}","strict_conflict":false}`,} 
      })
    logger.info({ backup }, "scb backed up on dbx successfully")
  } catch (error) {
    logger.error({ error }, "scb backup to dbx failed")
  }
}

if(!GcsApplicationCredentials){
  logger.debug("No Google Cloud Application credentials defined - skipping scb backup")
}else{
    logger.debug({ backup }, "updating scb on gcs")
    try {
      const storage = new Storage({
        keyFilename: GcsApplicationCredentials,
      })
      const bucket = storage.bucket(LND_SCB_BACKUP_BUCKET_NAME)
      const file = bucket.file(`${filename}`)
      await file.save(backup)
      logger.info({ backup }, "scb backed up on gcs successfully")
    } catch (error) {
      logger.error({ error }, "scb backup to gcs failed")
    }
  }

if (!(Nextcloudurl && Nextclouduser && Nextcloudpassword)){
logger.debug("No Nextcloud credentials defined - skipping scb backup")
}else{
    logger.debug({ backup }, "updating scb on nextcloud")
    try {
      await axios.put(`${Nextcloudurl}/${filename}`,backup,{
        auth: {
            username: Nextclouduser,
            password: Nextcloudpassword
          }},);
      logger.info({ backup }, "scb backed up on nextcloud successfully")
    } catch (error) {
      logger.error({ error }, "scb backup to nextcloud failed")
    }
  }

  }
