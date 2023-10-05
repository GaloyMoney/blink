import { Storage } from "@google-cloud/storage"

import axios from "axios"

import {
  DROPBOX_ACCESS_TOKEN,
  GCS_APPLICATION_CREDENTIALS_PATH,
  LND_SCB_BACKUP_BUCKET_NAME,
  NETWORK,
  NEXTCLOUD_PASSWORD,
  NEXTCLOUD_URL,
  NEXTCLOUD_USER,
} from "@/config"
import { ErrorLevel } from "@/domain/shared"
import {
  SemanticAttributes,
  addAttributesToCurrentSpan,
  addEventToCurrentSpan,
  asyncRunInSpan,
  recordExceptionInCurrentSpan,
} from "@/services/tracing"

export const uploadBackup =
  (logger: Logger) =>
  async ({ backup, pubkey }: { backup: string; pubkey: Pubkey }) => {
    logger.debug({ backup }, "updating scb on dbx")
    const filename = `${NETWORK}_lnd_scb_${pubkey}_${Date.now()}`

    if (
      !(
        DROPBOX_ACCESS_TOKEN ||
        GCS_APPLICATION_CREDENTIALS_PATH ||
        (NEXTCLOUD_URL && NEXTCLOUD_USER && NEXTCLOUD_PASSWORD)
      )
    ) {
      const err = new Error(
        "Missing environment variable for LND static channel backup destination.",
      )
      logger.error(err)
      recordExceptionInCurrentSpan({ error: err, level: ErrorLevel.Critical })
    }

    if (!DROPBOX_ACCESS_TOKEN) {
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
                "Authorization": `Bearer ${DROPBOX_ACCESS_TOKEN}`,
                "Content-Type": `Application/octet-stream`,
                "Dropbox-API-Arg": `{"autorename":false,"mode":"add","mute":true,"path":"/${filename}","strict_conflict":false}`,
              },
            })
            logger.info({ backup }, "Static channel backup to Dropbox successful.")
            addEventToCurrentSpan("Static channel backup to Dropbox successful.")
          } catch (error) {
            const fallbackMsg = "Static channel backup to Dropbox failed."
            logger.error({ error }, fallbackMsg)
            recordExceptionInCurrentSpan({
              error: error,
              level: ErrorLevel.Warn,
              fallbackMsg,
            })
          }
        },
      )
    }

    if (!GCS_APPLICATION_CREDENTIALS_PATH) {
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
              keyFilename: GCS_APPLICATION_CREDENTIALS_PATH,
            })
            const bucket = storage.bucket(LND_SCB_BACKUP_BUCKET_NAME)
            const file = bucket.file(`lnd_scb/${filename}`)
            await file.save(backup)
            logger.info({ backup }, "Static channel backup to GoogleCloud successful.")
            addEventToCurrentSpan("Static channel backup to GoogleCloud successful.")
          } catch (error) {
            const fallbackMsg = "Static channel backup to GoogleCloud failed."
            logger.error({ error }, fallbackMsg)
            recordExceptionInCurrentSpan({
              error: error,
              level: ErrorLevel.Warn,
              fallbackMsg,
            })
          }
        },
      )
    }

    if (!(NEXTCLOUD_URL && NEXTCLOUD_USER && NEXTCLOUD_PASSWORD)) {
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
            await axios.put(`${NEXTCLOUD_URL}/${filename}`, backup, {
              auth: {
                username: `${NEXTCLOUD_USER}`,
                password: `${NEXTCLOUD_PASSWORD}`,
              },
            })
            logger.info({ backup }, "Static channel backup to Nextcloud successful.")
            addEventToCurrentSpan("Static channel backup to Nextcloud successful.")
          } catch (error) {
            const fallbackMsg = "Static channel backup to Nextcloud failed."
            logger.error({ error }, fallbackMsg)
            recordExceptionInCurrentSpan({
              error: error,
              level: ErrorLevel.Warn,
              fallbackMsg,
            })
          }
        },
      )
    }
  }
