import { promisify } from "util"

import { credentials, Metadata } from "@grpc/grpc-js"

import { NotificationsServiceClient } from "./proto/notifications_grpc_pb"

import {
  ShouldSendNotificationRequest,
  ShouldSendNotificationResponse,
  DisableNotificationCategoryRequest,
  DisableNotificationCategoryResponse,
  EnableNotificationCategoryRequest,
  EnableNotificationCategoryResponse,
  EnableNotificationChannelRequest,
  EnableNotificationChannelResponse,
  DisableNotificationChannelRequest,
  DisableNotificationChannelResponse,
  GetNotificationSettingsRequest,
  GetNotificationSettingsResponse,
  UpdateUserLocaleRequest,
  UpdateUserLocaleResponse,
  AddPushDeviceTokenRequest,
  AddPushDeviceTokenResponse,
  RemovePushDeviceTokenRequest,
  RemovePushDeviceTokenResponse,
  UpdateEmailAddressRequest,
  UpdateEmailAddressResponse,
  RemoveEmailAddressRequest,
  RemoveEmailAddressResponse,
  HandleNotificationEventRequest,
  HandleNotificationEventResponse,
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

export const enableNotificationCatgeory = promisify<
  EnableNotificationCategoryRequest,
  Metadata,
  EnableNotificationCategoryResponse
>(notificationsClient.enableNotificationCategory.bind(notificationsClient))

export const disableNotificationCategory = promisify<
  DisableNotificationCategoryRequest,
  Metadata,
  DisableNotificationCategoryResponse
>(notificationsClient.disableNotificationCategory.bind(notificationsClient))

export const enableNotificationChannel = promisify<
  EnableNotificationChannelRequest,
  Metadata,
  EnableNotificationChannelResponse
>(notificationsClient.enableNotificationChannel.bind(notificationsClient))

export const disableNotificationChannel = promisify<
  DisableNotificationChannelRequest,
  Metadata,
  DisableNotificationChannelResponse
>(notificationsClient.disableNotificationChannel.bind(notificationsClient))

export const getNotificationSettings = promisify<
  GetNotificationSettingsRequest,
  Metadata,
  GetNotificationSettingsResponse
>(notificationsClient.getNotificationSettings.bind(notificationsClient))

export const updateUserLocale = promisify<
  UpdateUserLocaleRequest,
  Metadata,
  UpdateUserLocaleResponse
>(notificationsClient.updateUserLocale.bind(notificationsClient))

export const addPushDeviceToken = promisify<
  AddPushDeviceTokenRequest,
  Metadata,
  AddPushDeviceTokenResponse
>(notificationsClient.addPushDeviceToken.bind(notificationsClient))

export const removePushDeviceToken = promisify<
  RemovePushDeviceTokenRequest,
  Metadata,
  RemovePushDeviceTokenResponse
>(notificationsClient.removePushDeviceToken.bind(notificationsClient))

export const updateEmailAddress = promisify<
  UpdateEmailAddressRequest,
  Metadata,
  UpdateEmailAddressResponse
>(notificationsClient.updateEmailAddress.bind(notificationsClient))

export const removeEmailAddress = promisify<
  RemoveEmailAddressRequest,
  Metadata,
  RemoveEmailAddressResponse
>(notificationsClient.removeEmailAddress.bind(notificationsClient))

export const handleNotificationEvent = promisify<
  HandleNotificationEventRequest,
  Metadata,
  HandleNotificationEventResponse
>(notificationsClient.handleNotificationEvent.bind(notificationsClient))
