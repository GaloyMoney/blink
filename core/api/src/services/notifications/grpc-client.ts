import { promisify } from "util"

import { credentials, Metadata } from "@grpc/grpc-js"

import { NotificationsServiceClient } from "./proto/notifications_grpc_pb"

import {
  ShouldSendNotificationRequest,
  ShouldSendNotificationResponse,
  UserDisableNotificationCategoryRequest,
  UserDisableNotificationCategoryResponse,
  UserEnableNotificationCategoryRequest,
  UserEnableNotificationCategoryResponse,
  UserEnableNotificationChannelRequest,
  UserEnableNotificationChannelResponse,
  UserDisableNotificationChannelRequest,
  UserDisableNotificationChannelResponse,
  UserNotificationSettingsRequest,
  UserNotificationSettingsResponse,
} from "./proto/notifications_pb"

import { NOTIFICATIONS_HOST, NOTIFICATIONS_PORT } from "@/config"

const notificationsEndpoint = `${NOTIFICATIONS_HOST}:${NOTIFICATIONS_PORT}`

const notificationsClient = new NotificationsServiceClient(
  notificationsEndpoint,
  credentials.createInsecure(),
)

export const notificationsMetadata = new Metadata()

export const shouldSendNotification = promisify<
  ShouldSendNotificationRequest,
  Metadata,
  ShouldSendNotificationResponse
>(notificationsClient.shouldSendNotification.bind(notificationsClient))

export const userEnableNotificationCatgeory = promisify<
  UserEnableNotificationCategoryRequest,
  Metadata,
  UserEnableNotificationCategoryResponse
>(notificationsClient.userEnableNotificationCategory.bind(notificationsClient))

export const userDisableNotificationCategory = promisify<
  UserDisableNotificationCategoryRequest,
  Metadata,
  UserDisableNotificationCategoryResponse
>(notificationsClient.userDisableNotificationCategory.bind(notificationsClient))

export const userEnableNotificationChannel = promisify<
  UserEnableNotificationChannelRequest,
  Metadata,
  UserEnableNotificationChannelResponse
>(notificationsClient.userEnableNotificationChannel.bind(notificationsClient))

export const userDisableNotificationChannel = promisify<
  UserDisableNotificationChannelRequest,
  Metadata,
  UserDisableNotificationChannelResponse
>(notificationsClient.userDisableNotificationChannel.bind(notificationsClient))

export const userNotificationSettings = promisify<
  UserNotificationSettingsRequest,
  Metadata,
  UserNotificationSettingsResponse
>(notificationsClient.userNotificationSettings.bind(notificationsClient))
