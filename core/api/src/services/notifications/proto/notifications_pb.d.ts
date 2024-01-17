// package: services.notifications.v1
// file: notifications.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class ShouldSendNotificationRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): ShouldSendNotificationRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): ShouldSendNotificationRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): ShouldSendNotificationRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShouldSendNotificationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ShouldSendNotificationRequest): ShouldSendNotificationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShouldSendNotificationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShouldSendNotificationRequest;
    static deserializeBinaryFromReader(message: ShouldSendNotificationRequest, reader: jspb.BinaryReader): ShouldSendNotificationRequest;
}

export namespace ShouldSendNotificationRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class ShouldSendNotificationResponse extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): ShouldSendNotificationResponse;
    getShouldSend(): boolean;
    setShouldSend(value: boolean): ShouldSendNotificationResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShouldSendNotificationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ShouldSendNotificationResponse): ShouldSendNotificationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShouldSendNotificationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShouldSendNotificationResponse;
    static deserializeBinaryFromReader(message: ShouldSendNotificationResponse, reader: jspb.BinaryReader): ShouldSendNotificationResponse;
}

export namespace ShouldSendNotificationResponse {
    export type AsObject = {
        userId: string,
        shouldSend: boolean,
    }
}

export class UserEnableNotificationChannelRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UserEnableNotificationChannelRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): UserEnableNotificationChannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserEnableNotificationChannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UserEnableNotificationChannelRequest): UserEnableNotificationChannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserEnableNotificationChannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserEnableNotificationChannelRequest;
    static deserializeBinaryFromReader(message: UserEnableNotificationChannelRequest, reader: jspb.BinaryReader): UserEnableNotificationChannelRequest;
}

export namespace UserEnableNotificationChannelRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
    }
}

export class UserEnableNotificationChannelResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): UserNotificationSettings | undefined;
    setNotificationSettings(value?: UserNotificationSettings): UserEnableNotificationChannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserEnableNotificationChannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UserEnableNotificationChannelResponse): UserEnableNotificationChannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserEnableNotificationChannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserEnableNotificationChannelResponse;
    static deserializeBinaryFromReader(message: UserEnableNotificationChannelResponse, reader: jspb.BinaryReader): UserEnableNotificationChannelResponse;
}

export namespace UserEnableNotificationChannelResponse {
    export type AsObject = {
        notificationSettings?: UserNotificationSettings.AsObject,
    }
}

export class UserNotificationSettings extends jspb.Message { 

    hasPush(): boolean;
    clearPush(): void;
    getPush(): ChannelNotificationSettings | undefined;
    setPush(value?: ChannelNotificationSettings): UserNotificationSettings;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserNotificationSettings.AsObject;
    static toObject(includeInstance: boolean, msg: UserNotificationSettings): UserNotificationSettings.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserNotificationSettings, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserNotificationSettings;
    static deserializeBinaryFromReader(message: UserNotificationSettings, reader: jspb.BinaryReader): UserNotificationSettings;
}

export namespace UserNotificationSettings {
    export type AsObject = {
        push?: ChannelNotificationSettings.AsObject,
    }
}

export class ChannelNotificationSettings extends jspb.Message { 
    getEnabled(): boolean;
    setEnabled(value: boolean): ChannelNotificationSettings;
    clearDisabledCategoriesList(): void;
    getDisabledCategoriesList(): Array<NotificationCategory>;
    setDisabledCategoriesList(value: Array<NotificationCategory>): ChannelNotificationSettings;
    addDisabledCategories(value: NotificationCategory, index?: number): NotificationCategory;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ChannelNotificationSettings.AsObject;
    static toObject(includeInstance: boolean, msg: ChannelNotificationSettings): ChannelNotificationSettings.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ChannelNotificationSettings, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ChannelNotificationSettings;
    static deserializeBinaryFromReader(message: ChannelNotificationSettings, reader: jspb.BinaryReader): ChannelNotificationSettings;
}

export namespace ChannelNotificationSettings {
    export type AsObject = {
        enabled: boolean,
        disabledCategoriesList: Array<NotificationCategory>,
    }
}

export class UserDisableNotificationChannelRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UserDisableNotificationChannelRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): UserDisableNotificationChannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserDisableNotificationChannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UserDisableNotificationChannelRequest): UserDisableNotificationChannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserDisableNotificationChannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserDisableNotificationChannelRequest;
    static deserializeBinaryFromReader(message: UserDisableNotificationChannelRequest, reader: jspb.BinaryReader): UserDisableNotificationChannelRequest;
}

export namespace UserDisableNotificationChannelRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
    }
}

export class UserDisableNotificationChannelResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): UserNotificationSettings | undefined;
    setNotificationSettings(value?: UserNotificationSettings): UserDisableNotificationChannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserDisableNotificationChannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UserDisableNotificationChannelResponse): UserDisableNotificationChannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserDisableNotificationChannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserDisableNotificationChannelResponse;
    static deserializeBinaryFromReader(message: UserDisableNotificationChannelResponse, reader: jspb.BinaryReader): UserDisableNotificationChannelResponse;
}

export namespace UserDisableNotificationChannelResponse {
    export type AsObject = {
        notificationSettings?: UserNotificationSettings.AsObject,
    }
}

export class UserDisableNotificationCategoryRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UserDisableNotificationCategoryRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): UserDisableNotificationCategoryRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): UserDisableNotificationCategoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserDisableNotificationCategoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UserDisableNotificationCategoryRequest): UserDisableNotificationCategoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserDisableNotificationCategoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserDisableNotificationCategoryRequest;
    static deserializeBinaryFromReader(message: UserDisableNotificationCategoryRequest, reader: jspb.BinaryReader): UserDisableNotificationCategoryRequest;
}

export namespace UserDisableNotificationCategoryRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class UserDisableNotificationCategoryResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): UserNotificationSettings | undefined;
    setNotificationSettings(value?: UserNotificationSettings): UserDisableNotificationCategoryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserDisableNotificationCategoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UserDisableNotificationCategoryResponse): UserDisableNotificationCategoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserDisableNotificationCategoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserDisableNotificationCategoryResponse;
    static deserializeBinaryFromReader(message: UserDisableNotificationCategoryResponse, reader: jspb.BinaryReader): UserDisableNotificationCategoryResponse;
}

export namespace UserDisableNotificationCategoryResponse {
    export type AsObject = {
        notificationSettings?: UserNotificationSettings.AsObject,
    }
}

export class UserEnableNotificationCategoryRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UserEnableNotificationCategoryRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): UserEnableNotificationCategoryRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): UserEnableNotificationCategoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserEnableNotificationCategoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UserEnableNotificationCategoryRequest): UserEnableNotificationCategoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserEnableNotificationCategoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserEnableNotificationCategoryRequest;
    static deserializeBinaryFromReader(message: UserEnableNotificationCategoryRequest, reader: jspb.BinaryReader): UserEnableNotificationCategoryRequest;
}

export namespace UserEnableNotificationCategoryRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class UserEnableNotificationCategoryResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): UserNotificationSettings | undefined;
    setNotificationSettings(value?: UserNotificationSettings): UserEnableNotificationCategoryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserEnableNotificationCategoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UserEnableNotificationCategoryResponse): UserEnableNotificationCategoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserEnableNotificationCategoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserEnableNotificationCategoryResponse;
    static deserializeBinaryFromReader(message: UserEnableNotificationCategoryResponse, reader: jspb.BinaryReader): UserEnableNotificationCategoryResponse;
}

export namespace UserEnableNotificationCategoryResponse {
    export type AsObject = {
        notificationSettings?: UserNotificationSettings.AsObject,
    }
}

export class UserNotificationSettingsRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UserNotificationSettingsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserNotificationSettingsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UserNotificationSettingsRequest): UserNotificationSettingsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserNotificationSettingsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserNotificationSettingsRequest;
    static deserializeBinaryFromReader(message: UserNotificationSettingsRequest, reader: jspb.BinaryReader): UserNotificationSettingsRequest;
}

export namespace UserNotificationSettingsRequest {
    export type AsObject = {
        userId: string,
    }
}

export class UserNotificationSettingsResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): UserNotificationSettings | undefined;
    setNotificationSettings(value?: UserNotificationSettings): UserNotificationSettingsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UserNotificationSettingsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UserNotificationSettingsResponse): UserNotificationSettingsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UserNotificationSettingsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UserNotificationSettingsResponse;
    static deserializeBinaryFromReader(message: UserNotificationSettingsResponse, reader: jspb.BinaryReader): UserNotificationSettingsResponse;
}

export namespace UserNotificationSettingsResponse {
    export type AsObject = {
        notificationSettings?: UserNotificationSettings.AsObject,
    }
}

export enum NotificationChannel {
    PUSH = 0,
}

export enum NotificationCategory {
    CIRCLES = 0,
    PAYMENTS = 1,
    BALANCE = 2,
    ADMIN_NOTIFICATION = 3,
}
