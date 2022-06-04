import {
  BTC_NETWORK,
  DropboxAccessToken,
  GcsApplicationCredentials,
  LND_SCB_BACKUP_BUCKET_NAME,
} from "@config"
import { Storage } from "@google-cloud/storage"
import { Dropbox } from "dropbox"

export const uploadBackup =
  (logger: Logger) =>
  async ({ backup, pubkey }: { backup: string; pubkey: Pubkey }) => {
    logger.debug({ backup }, "updating scb on dbx")
    const filename = `${BTC_NETWORK}_lnd_scb_${pubkey}_${Date.now()}`

    try {
      const dbx = new Dropbox({ accessToken: DropboxAccessToken })
      await dbx.filesUpload({ path: `/${filename}`, contents: backup })
      logger.info({ backup }, "scb backed up on dbx successfully")
    } catch (error) {
      logger.error({ error }, "scb backup to dbx failed")
    }

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
