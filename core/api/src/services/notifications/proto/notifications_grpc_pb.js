// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var notifications_pb = require('./notifications_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_services_notifications_v1_DisableNotificationCategoryRequest(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationCategoryRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationCategoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationCategoryRequest(buffer_arg) {
  return notifications_pb.DisableNotificationCategoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_DisableNotificationCategoryResponse(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationCategoryResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationCategoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationCategoryResponse(buffer_arg) {
  return notifications_pb.DisableNotificationCategoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_DisableNotificationChannelRequest(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationChannelRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationChannelRequest(buffer_arg) {
  return notifications_pb.DisableNotificationChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_DisableNotificationChannelResponse(arg) {
  if (!(arg instanceof notifications_pb.DisableNotificationChannelResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.DisableNotificationChannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_DisableNotificationChannelResponse(buffer_arg) {
  return notifications_pb.DisableNotificationChannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationCategoryRequest(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationCategoryRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationCategoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationCategoryRequest(buffer_arg) {
  return notifications_pb.EnableNotificationCategoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationCategoryResponse(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationCategoryResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationCategoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationCategoryResponse(buffer_arg) {
  return notifications_pb.EnableNotificationCategoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationChannelRequest(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationChannelRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationChannelRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationChannelRequest(buffer_arg) {
  return notifications_pb.EnableNotificationChannelRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_EnableNotificationChannelResponse(arg) {
  if (!(arg instanceof notifications_pb.EnableNotificationChannelResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.EnableNotificationChannelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_EnableNotificationChannelResponse(buffer_arg) {
  return notifications_pb.EnableNotificationChannelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_GetNotificationSettingsRequest(arg) {
  if (!(arg instanceof notifications_pb.GetNotificationSettingsRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.GetNotificationSettingsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_GetNotificationSettingsRequest(buffer_arg) {
  return notifications_pb.GetNotificationSettingsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_GetNotificationSettingsResponse(arg) {
  if (!(arg instanceof notifications_pb.GetNotificationSettingsResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.GetNotificationSettingsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_GetNotificationSettingsResponse(buffer_arg) {
  return notifications_pb.GetNotificationSettingsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

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

function serialize_services_notifications_v1_UpdateUserLocaleRequest(arg) {
  if (!(arg instanceof notifications_pb.UpdateUserLocaleRequest)) {
    throw new Error('Expected argument of type services.notifications.v1.UpdateUserLocaleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UpdateUserLocaleRequest(buffer_arg) {
  return notifications_pb.UpdateUserLocaleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_notifications_v1_UpdateUserLocaleResponse(arg) {
  if (!(arg instanceof notifications_pb.UpdateUserLocaleResponse)) {
    throw new Error('Expected argument of type services.notifications.v1.UpdateUserLocaleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_notifications_v1_UpdateUserLocaleResponse(buffer_arg) {
  return notifications_pb.UpdateUserLocaleResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  enableNotificationChannel: {
    path: '/services.notifications.v1.NotificationsService/EnableNotificationChannel',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.EnableNotificationChannelRequest,
    responseType: notifications_pb.EnableNotificationChannelResponse,
    requestSerialize: serialize_services_notifications_v1_EnableNotificationChannelRequest,
    requestDeserialize: deserialize_services_notifications_v1_EnableNotificationChannelRequest,
    responseSerialize: serialize_services_notifications_v1_EnableNotificationChannelResponse,
    responseDeserialize: deserialize_services_notifications_v1_EnableNotificationChannelResponse,
  },
  disableNotificationChannel: {
    path: '/services.notifications.v1.NotificationsService/DisableNotificationChannel',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.DisableNotificationChannelRequest,
    responseType: notifications_pb.DisableNotificationChannelResponse,
    requestSerialize: serialize_services_notifications_v1_DisableNotificationChannelRequest,
    requestDeserialize: deserialize_services_notifications_v1_DisableNotificationChannelRequest,
    responseSerialize: serialize_services_notifications_v1_DisableNotificationChannelResponse,
    responseDeserialize: deserialize_services_notifications_v1_DisableNotificationChannelResponse,
  },
  enableNotificationCategory: {
    path: '/services.notifications.v1.NotificationsService/EnableNotificationCategory',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.EnableNotificationCategoryRequest,
    responseType: notifications_pb.EnableNotificationCategoryResponse,
    requestSerialize: serialize_services_notifications_v1_EnableNotificationCategoryRequest,
    requestDeserialize: deserialize_services_notifications_v1_EnableNotificationCategoryRequest,
    responseSerialize: serialize_services_notifications_v1_EnableNotificationCategoryResponse,
    responseDeserialize: deserialize_services_notifications_v1_EnableNotificationCategoryResponse,
  },
  disableNotificationCategory: {
    path: '/services.notifications.v1.NotificationsService/DisableNotificationCategory',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.DisableNotificationCategoryRequest,
    responseType: notifications_pb.DisableNotificationCategoryResponse,
    requestSerialize: serialize_services_notifications_v1_DisableNotificationCategoryRequest,
    requestDeserialize: deserialize_services_notifications_v1_DisableNotificationCategoryRequest,
    responseSerialize: serialize_services_notifications_v1_DisableNotificationCategoryResponse,
    responseDeserialize: deserialize_services_notifications_v1_DisableNotificationCategoryResponse,
  },
  getNotificationSettings: {
    path: '/services.notifications.v1.NotificationsService/GetNotificationSettings',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.GetNotificationSettingsRequest,
    responseType: notifications_pb.GetNotificationSettingsResponse,
    requestSerialize: serialize_services_notifications_v1_GetNotificationSettingsRequest,
    requestDeserialize: deserialize_services_notifications_v1_GetNotificationSettingsRequest,
    responseSerialize: serialize_services_notifications_v1_GetNotificationSettingsResponse,
    responseDeserialize: deserialize_services_notifications_v1_GetNotificationSettingsResponse,
  },
  updateUserLocale: {
    path: '/services.notifications.v1.NotificationsService/UpdateUserLocale',
    requestStream: false,
    responseStream: false,
    requestType: notifications_pb.UpdateUserLocaleRequest,
    responseType: notifications_pb.UpdateUserLocaleResponse,
    requestSerialize: serialize_services_notifications_v1_UpdateUserLocaleRequest,
    requestDeserialize: deserialize_services_notifications_v1_UpdateUserLocaleRequest,
    responseSerialize: serialize_services_notifications_v1_UpdateUserLocaleResponse,
    responseDeserialize: deserialize_services_notifications_v1_UpdateUserLocaleResponse,
  },
};

exports.NotificationsServiceClient = grpc.makeGenericClientConstructor(NotificationsServiceService);
