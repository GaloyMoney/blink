// package: services.notifications.v1
// file: notifications.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as notifications_pb from "./notifications_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface INotificationsServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    shouldSendNotification: INotificationsServiceService_IShouldSendNotification;
    userEnableNotificationChannel: INotificationsServiceService_IUserEnableNotificationChannel;
    userDisableNotificationChannel: INotificationsServiceService_IUserDisableNotificationChannel;
    userEnableNotificationCategory: INotificationsServiceService_IUserEnableNotificationCategory;
    userDisableNotificationCategory: INotificationsServiceService_IUserDisableNotificationCategory;
    userNotificationSettings: INotificationsServiceService_IUserNotificationSettings;
}

interface INotificationsServiceService_IShouldSendNotification extends grpc.MethodDefinition<notifications_pb.ShouldSendNotificationRequest, notifications_pb.ShouldSendNotificationResponse> {
    path: "/services.notifications.v1.NotificationsService/ShouldSendNotification";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.ShouldSendNotificationRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.ShouldSendNotificationRequest>;
    responseSerialize: grpc.serialize<notifications_pb.ShouldSendNotificationResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.ShouldSendNotificationResponse>;
}
interface INotificationsServiceService_IUserEnableNotificationChannel extends grpc.MethodDefinition<notifications_pb.UserEnableNotificationChannelRequest, notifications_pb.UserEnableNotificationChannelResponse> {
    path: "/services.notifications.v1.NotificationsService/UserEnableNotificationChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.UserEnableNotificationChannelRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.UserEnableNotificationChannelRequest>;
    responseSerialize: grpc.serialize<notifications_pb.UserEnableNotificationChannelResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.UserEnableNotificationChannelResponse>;
}
interface INotificationsServiceService_IUserDisableNotificationChannel extends grpc.MethodDefinition<notifications_pb.UserDisableNotificationChannelRequest, notifications_pb.UserDisableNotificationChannelResponse> {
    path: "/services.notifications.v1.NotificationsService/UserDisableNotificationChannel";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.UserDisableNotificationChannelRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.UserDisableNotificationChannelRequest>;
    responseSerialize: grpc.serialize<notifications_pb.UserDisableNotificationChannelResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.UserDisableNotificationChannelResponse>;
}
interface INotificationsServiceService_IUserEnableNotificationCategory extends grpc.MethodDefinition<notifications_pb.UserEnableNotificationCategoryRequest, notifications_pb.UserEnableNotificationCategoryResponse> {
    path: "/services.notifications.v1.NotificationsService/UserEnableNotificationCategory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.UserEnableNotificationCategoryRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.UserEnableNotificationCategoryRequest>;
    responseSerialize: grpc.serialize<notifications_pb.UserEnableNotificationCategoryResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.UserEnableNotificationCategoryResponse>;
}
interface INotificationsServiceService_IUserDisableNotificationCategory extends grpc.MethodDefinition<notifications_pb.UserDisableNotificationCategoryRequest, notifications_pb.UserDisableNotificationCategoryResponse> {
    path: "/services.notifications.v1.NotificationsService/UserDisableNotificationCategory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.UserDisableNotificationCategoryRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.UserDisableNotificationCategoryRequest>;
    responseSerialize: grpc.serialize<notifications_pb.UserDisableNotificationCategoryResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.UserDisableNotificationCategoryResponse>;
}
interface INotificationsServiceService_IUserNotificationSettings extends grpc.MethodDefinition<notifications_pb.UserNotificationSettingsRequest, notifications_pb.UserNotificationSettingsResponse> {
    path: "/services.notifications.v1.NotificationsService/UserNotificationSettings";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<notifications_pb.UserNotificationSettingsRequest>;
    requestDeserialize: grpc.deserialize<notifications_pb.UserNotificationSettingsRequest>;
    responseSerialize: grpc.serialize<notifications_pb.UserNotificationSettingsResponse>;
    responseDeserialize: grpc.deserialize<notifications_pb.UserNotificationSettingsResponse>;
}

export const NotificationsServiceService: INotificationsServiceService;

export interface INotificationsServiceServer extends grpc.UntypedServiceImplementation {
    shouldSendNotification: grpc.handleUnaryCall<notifications_pb.ShouldSendNotificationRequest, notifications_pb.ShouldSendNotificationResponse>;
    userEnableNotificationChannel: grpc.handleUnaryCall<notifications_pb.UserEnableNotificationChannelRequest, notifications_pb.UserEnableNotificationChannelResponse>;
    userDisableNotificationChannel: grpc.handleUnaryCall<notifications_pb.UserDisableNotificationChannelRequest, notifications_pb.UserDisableNotificationChannelResponse>;
    userEnableNotificationCategory: grpc.handleUnaryCall<notifications_pb.UserEnableNotificationCategoryRequest, notifications_pb.UserEnableNotificationCategoryResponse>;
    userDisableNotificationCategory: grpc.handleUnaryCall<notifications_pb.UserDisableNotificationCategoryRequest, notifications_pb.UserDisableNotificationCategoryResponse>;
    userNotificationSettings: grpc.handleUnaryCall<notifications_pb.UserNotificationSettingsRequest, notifications_pb.UserNotificationSettingsResponse>;
}

export interface INotificationsServiceClient {
    shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    userEnableNotificationChannel(request: notifications_pb.UserEnableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    userEnableNotificationChannel(request: notifications_pb.UserEnableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    userEnableNotificationChannel(request: notifications_pb.UserEnableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    userDisableNotificationChannel(request: notifications_pb.UserDisableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    userDisableNotificationChannel(request: notifications_pb.UserDisableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    userDisableNotificationChannel(request: notifications_pb.UserDisableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    userEnableNotificationCategory(request: notifications_pb.UserEnableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    userEnableNotificationCategory(request: notifications_pb.UserEnableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    userEnableNotificationCategory(request: notifications_pb.UserEnableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    userDisableNotificationCategory(request: notifications_pb.UserDisableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    userDisableNotificationCategory(request: notifications_pb.UserDisableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    userDisableNotificationCategory(request: notifications_pb.UserDisableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    userNotificationSettings(request: notifications_pb.UserNotificationSettingsRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    userNotificationSettings(request: notifications_pb.UserNotificationSettingsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    userNotificationSettings(request: notifications_pb.UserNotificationSettingsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
}

export class NotificationsServiceClient extends grpc.Client implements INotificationsServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    public shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    public shouldSendNotification(request: notifications_pb.ShouldSendNotificationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.ShouldSendNotificationResponse) => void): grpc.ClientUnaryCall;
    public userEnableNotificationChannel(request: notifications_pb.UserEnableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public userEnableNotificationChannel(request: notifications_pb.UserEnableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public userEnableNotificationChannel(request: notifications_pb.UserEnableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public userDisableNotificationChannel(request: notifications_pb.UserDisableNotificationChannelRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public userDisableNotificationChannel(request: notifications_pb.UserDisableNotificationChannelRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public userDisableNotificationChannel(request: notifications_pb.UserDisableNotificationChannelRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationChannelResponse) => void): grpc.ClientUnaryCall;
    public userEnableNotificationCategory(request: notifications_pb.UserEnableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public userEnableNotificationCategory(request: notifications_pb.UserEnableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public userEnableNotificationCategory(request: notifications_pb.UserEnableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserEnableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public userDisableNotificationCategory(request: notifications_pb.UserDisableNotificationCategoryRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public userDisableNotificationCategory(request: notifications_pb.UserDisableNotificationCategoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public userDisableNotificationCategory(request: notifications_pb.UserDisableNotificationCategoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserDisableNotificationCategoryResponse) => void): grpc.ClientUnaryCall;
    public userNotificationSettings(request: notifications_pb.UserNotificationSettingsRequest, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    public userNotificationSettings(request: notifications_pb.UserNotificationSettingsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
    public userNotificationSettings(request: notifications_pb.UserNotificationSettingsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: notifications_pb.UserNotificationSettingsResponse) => void): grpc.ClientUnaryCall;
}
