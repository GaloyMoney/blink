import {
  BTC_NETWORK,
  DropboxAccessToken,
  GcsApplicationCredentials,
  LND_SCB_BACKUP_BUCKET_NAME,
  Nextcloudurl,
  Nextclouduser,
  Nextcloudpassword,
} from "@config"
import { Storage } from "@google-cloud/storage"
import axios from "axios"
import {
  asyncRunInSpan,
  SemanticAttributes,
  addAttributesToCurrentSpan,
  addEventToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import { ErrorLevel } from "@domain/shared"

export const uploadBackup =
  (logger: Logger) =>
  async ({ backup, pubkey }: { backup: string; pubkey: Pubkey }) => {
    logger.debug({ backup }, "updating scb on dbx")
    const filename = `${BTC_NETWORK}_lnd_scb_${pubkey}_${Date.now()}`

    if (
      !(
        DropboxAccessToken ||
        GcsApplicationCredentials ||
        (Nextcloudurl && Nextclouduser && Nextcloudpassword)
      )
    ) {
      const err = new Error(
        "Missing environment variable for LND static channel backup destination.",
      )
      logger.error(err)
      recordExceptionInCurrentSpan({ error: err, level: ErrorLevel.Critical })
    }

    if (!DropboxAccessToken) {
      addAttributesToCurrentSpan({ ["uploadBackup.destination.dropbox"]: "false" })
    } else {
      addAttributesToCurrentSpan({ ["uploadBackup.destination.dropbox"]: "true" })
      asyncRunInSpan(
        "app.admin.backup.uploadBackup.dropbox",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: "uploadBackup.dropbox",
            [SemanticAttributes.CODE_NAMESPACE]: "app.admin.backup",
          },
        },
        async () => {
          try {
            await axios.post(`https://content.dropboxapi.com/2/files/upload`, backup, {
              headers: {
                "Authorization": `Bearer ${DropboxAccessToken}`,
                "Content-Type": `Application/octet-stream`,
                "Dropbox-API-Arg": `{"autorename":false,"mode":"add","mute":true,"path":"/${filename}","strict_conflict":false}`,
              },
            })
            logger.info({ backup }, "Static channel backup to Dropbox successful.")
            addEventToCurrentSpan("Static channel backup to Dropbox successful.")
          } catch (error) {
            logger.error({ error }, "Static channel backup to Dropbox failed.")
            recordExceptionInCurrentSpan({ error: error, level: ErrorLevel.Warn })
          }
        },
      )
    }

    if (!GcsApplicationCredentials) {
      addAttributesToCurrentSpan({ ["uploadBackup.destination.googlecloud"]: "false" })
    } else {
      addAttributesToCurrentSpan({ ["uploadBackup.destination.googlecloud"]: "true" })
      asyncRunInSpan(
        "app.admin.backup.uploadBackup.googlecloud",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: "uploadBackup.googlecloud",
            [SemanticAttributes.CODE_NAMESPACE]: "app.admin.backup",
          },
        },
        async () => {
          try {
            const storage = new Storage({
              keyFilename: GcsApplicationCredentials,
            })
            const bucket = storage.bucket(LND_SCB_BACKUP_BUCKET_NAME)
            const file = bucket.file(`lnd_scb/${filename}`)
            await file.save(backup)
            logger.info({ backup }, "Static channel backup to GoogleCloud successful.")
            addEventToCurrentSpan("Static channel backup to GoogleCloud successful.")
          } catch (error) {
            logger.error({ error }, "Static channel backup to GoogleCloud failed.")
            recordExceptionInCurrentSpan({ error: error, level: ErrorLevel.Warn })
          }
        },
      )
    }

    if (!(Nextcloudurl && Nextclouduser && Nextcloudpassword)) {
      addAttributesToCurrentSpan({ ["uploadBackup.destination.nextcloud"]: "false" })
    } else {
      addAttributesToCurrentSpan({ ["uploadBackup.destination.nextcloud"]: "true" })
      asyncRunInSpan(
        "app.admin.backup.uploadBackup.nextcloud",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: "uploadBackup.nextcloud",
            [SemanticAttributes.CODE_NAMESPACE]: "app.admin.backup",
          },
        },
        async () => {
          try {
            await axios.put(`${Nextcloudurl}/${filename}`, backup, {
              auth: {
                username: `${Nextclouduser}`,
                password: `${Nextcloudpassword}`,
              },
            })
            logger.info({ backup }, "Static channel backup to Nextcloud successful.")
            addEventToCurrentSpan("Static channel backup to Nextcloud successful.")
          } catch (error) {
            logger.error({ error }, "Static channel backup to Nextcloud failed.")
            recordExceptionInCurrentSpan({ error: error, level: ErrorLevel.Warn })
          }
        },
      )
    }
  }
