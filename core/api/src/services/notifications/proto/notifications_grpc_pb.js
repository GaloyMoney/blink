// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var notifications_pb = require('./notifications_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_services_notifications_v1_ShouldSendNotificationRequest(arg) {
  if (!(arg instanceof notifications_pb.ShouldSendNotificationRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.ShouldSendNotificationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_ShouldSendNotificationRequest(buffer_arg) {
  return notifications_pb.ShouldSendNotificationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_ShouldSendNotificationResponse(arg) {
  if (!(arg instanceof notifications_pb.ShouldSendNotificationResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.ShouldSendNotificationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_ShouldSendNotificationResponse(buffer_arg) {
  return notifications_pb.ShouldSendNotificationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserDisableNotificationCategoryRequest(arg) {
  if (!(arg instanceof notifications_pb.UserDisableNotificationCategoryRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UserDisableNotificationCategoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserDisableNotificationCategoryRequest(buffer_arg) {
  return notifications_pb.UserDisableNotificationCategoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserDisableNotificationCategoryResponse(arg) {
  if (!(arg instanceof notifications_pb.UserDisableNotificationCategoryResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UserDisableNotificationCategoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserDisableNotificationCategoryResponse(buffer_arg) {
  return notifications_pb.UserDisableNotificationCategoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserDisableNotificationChannelRequest(arg) {
  if (!(arg instanceof notifications_pb.UserDisableNotificationChannelRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UserDisableNotificationChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserDisableNotificationChannelRequest(buffer_arg) {
  return notifications_pb.UserDisableNotificationChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserDisableNotificationChannelResponse(arg) {
  if (!(arg instanceof notifications_pb.UserDisableNotificationChannelResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UserDisableNotificationChannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserDisableNotificationChannelResponse(buffer_arg) {
  return notifications_pb.UserDisableNotificationChannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserEnableNotificationCategoryRequest(arg) {
  if (!(arg instanceof notifications_pb.UserEnableNotificationCategoryRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UserEnableNotificationCategoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserEnableNotificationCategoryRequest(buffer_arg) {
  return notifications_pb.UserEnableNotificationCategoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserEnableNotificationCategoryResponse(arg) {
  if (!(arg instanceof notifications_pb.UserEnableNotificationCategoryResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UserEnableNotificationCategoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserEnableNotificationCategoryResponse(buffer_arg) {
  return notifications_pb.UserEnableNotificationCategoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserEnableNotificationChannelRequest(arg) {
  if (!(arg instanceof notifications_pb.UserEnableNotificationChannelRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UserEnableNotificationChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserEnableNotificationChannelRequest(buffer_arg) {
  return notifications_pb.UserEnableNotificationChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserEnableNotificationChannelResponse(arg) {
  if (!(arg instanceof notifications_pb.UserEnableNotificationChannelResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UserEnableNotificationChannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserEnableNotificationChannelResponse(buffer_arg) {
  return notifications_pb.UserEnableNotificationChannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserNotificationSettingsRequest(arg) {
  if (!(arg instanceof notifications_pb.UserNotificationSettingsRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UserNotificationSettingsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserNotificationSettingsRequest(buffer_arg) {
  return notifications_pb.UserNotificationSettingsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UserNotificationSettingsResponse(arg) {
  if (!(arg instanceof notifications_pb.UserNotificationSettingsResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UserNotificationSettingsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UserNotificationSettingsResponse(buffer_arg) {
  return notifications_pb.UserNotificationSettingsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var NotificationsServiceService = exports.NotificationsServiceService = {
  shouldSendNotification: {
    path: '/services.notifications.v1.NotificationsService/ShouldSendNotification',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.ShouldSendNotificationRequest,
    responseType: notifications_pb.ShouldSendNotificationResponse,
    requestSerialize: serialize_services_notifications_v1_ShouldSendNotificationRequest,
    requestDeserialize: deserialize_services_notifications_v1_ShouldSendNotificationRequest,
    responseSerialize: serialize_services_notifications_v1_ShouldSendNotificationResponse,
    responseDeserialize: deserialize_services_notifications_v1_ShouldSendNotificationResponse,
  },
  userEnableNotificationChannel: {
    path: '/services.notifications.v1.NotificationsService/UserEnableNotificationChannel',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UserEnableNotificationChannelRequest,
    responseType: notifications_pb.UserEnableNotificationChannelResponse,
    requestSerialize: serialize_services_notifications_v1_UserEnableNotificationChannelRequest,
    requestDeserialize: deserialize_services_notifications_v1_UserEnableNotificationChannelRequest,
    responseSerialize: serialize_services_notifications_v1_UserEnableNotificationChannelResponse,
    responseDeserialize: deserialize_services_notifications_v1_UserEnableNotificationChannelResponse,
  },
  userDisableNotificationChannel: {
    path: '/services.notifications.v1.NotificationsService/UserDisableNotificationChannel',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UserDisableNotificationChannelRequest,
    responseType: notifications_pb.UserDisableNotificationChannelResponse,
    requestSerialize: serialize_services_notifications_v1_UserDisableNotificationChannelRequest,
    requestDeserialize: deserialize_services_notifications_v1_UserDisableNotificationChannelRequest,
    responseSerialize: serialize_services_notifications_v1_UserDisableNotificationChannelResponse,
    responseDeserialize: deserialize_services_notifications_v1_UserDisableNotificationChannelResponse,
  },
  userEnableNotificationCategory: {
    path: '/services.notifications.v1.NotificationsService/UserEnableNotificationCategory',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UserEnableNotificationCategoryRequest,
    responseType: notifications_pb.UserEnableNotificationCategoryResponse,
    requestSerialize: serialize_services_notifications_v1_UserEnableNotificationCategoryRequest,
    requestDeserialize: deserialize_services_notifications_v1_UserEnableNotificationCategoryRequest,
    responseSerialize: serialize_services_notifications_v1_UserEnableNotificationCategoryResponse,
    responseDeserialize: deserialize_services_notifications_v1_UserEnableNotificationCategoryResponse,
  },
  userDisableNotificationCategory: {
    path: '/services.notifications.v1.NotificationsService/UserDisableNotificationCategory',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UserDisableNotificationCategoryRequest,
    responseType: notifications_pb.UserDisableNotificationCategoryResponse,
    requestSerialize: serialize_services_notifications_v1_UserDisableNotificationCategoryRequest,
    requestDeserialize: deserialize_services_notifications_v1_UserDisableNotificationCategoryRequest,
    responseSerialize: serialize_services_notifications_v1_UserDisableNotificationCategoryResponse,
    responseDeserialize: deserialize_services_notifications_v1_UserDisableNotificationCategoryResponse,
  },
  userNotificationSettings: {
    path: '/services.notifications.v1.NotificationsService/UserNotificationSettings',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UserNotificationSettingsRequest,
    responseType: notifications_pb.UserNotificationSettingsResponse,
    requestSerialize: serialize_services_notifications_v1_UserNotificationSettingsRequest,
    requestDeserialize: deserialize_services_notifications_v1_UserNotificationSettingsRequest,
    responseSerialize: serialize_services_notifications_v1_UserNotificationSettingsResponse,
    responseDeserialize: deserialize_services_notifications_v1_UserNotificationSettingsResponse,
  },
};

exports.NotificationsServiceClient = grpc.makeGenericClientConstructor(NotificationsServiceService);
