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

export class EnableNotificationChannelRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): EnableNotificationChannelRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): EnableNotificationChannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationChannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationChannelRequest): EnableNotificationChannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationChannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationChannelRequest;
    static deserializeBinaryFromReader(message: EnableNotificationChannelRequest, reader: jspb.BinaryReader): EnableNotificationChannelRequest;
}

export namespace EnableNotificationChannelRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
    }
}

export class EnableNotificationChannelResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): EnableNotificationChannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationChannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationChannelResponse): EnableNotificationChannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationChannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationChannelResponse;
    static deserializeBinaryFromReader(message: EnableNotificationChannelResponse, reader: jspb.BinaryReader): EnableNotificationChannelResponse;
}

export namespace EnableNotificationChannelResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class NotificationSettings extends jspb.Message { 

    hasPush(): boolean;
    clearPush(): void;
    getPush(): ChannelNotificationSettings | undefined;
    setPush(value?: ChannelNotificationSettings): NotificationSettings;
    getLocale(): string;
    setLocale(value: string): NotificationSettings;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NotificationSettings.AsObject;
    static toObject(includeInstance: boolean, msg: NotificationSettings): NotificationSettings.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NotificationSettings, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NotificationSettings;
    static deserializeBinaryFromReader(message: NotificationSettings, reader: jspb.BinaryReader): NotificationSettings;
}

export namespace NotificationSettings {
    export type AsObject = {
        push?: ChannelNotificationSettings.AsObject,
        locale: string,
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

export class DisableNotificationChannelRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): DisableNotificationChannelRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): DisableNotificationChannelRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationChannelRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationChannelRequest): DisableNotificationChannelRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationChannelRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationChannelRequest;
    static deserializeBinaryFromReader(message: DisableNotificationChannelRequest, reader: jspb.BinaryReader): DisableNotificationChannelRequest;
}

export namespace DisableNotificationChannelRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
    }
}

export class DisableNotificationChannelResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): DisableNotificationChannelResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationChannelResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationChannelResponse): DisableNotificationChannelResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationChannelResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationChannelResponse;
    static deserializeBinaryFromReader(message: DisableNotificationChannelResponse, reader: jspb.BinaryReader): DisableNotificationChannelResponse;
}

export namespace DisableNotificationChannelResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class DisableNotificationCategoryRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): DisableNotificationCategoryRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): DisableNotificationCategoryRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): DisableNotificationCategoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationCategoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationCategoryRequest): DisableNotificationCategoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationCategoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationCategoryRequest;
    static deserializeBinaryFromReader(message: DisableNotificationCategoryRequest, reader: jspb.BinaryReader): DisableNotificationCategoryRequest;
}

export namespace DisableNotificationCategoryRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class DisableNotificationCategoryResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): DisableNotificationCategoryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisableNotificationCategoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DisableNotificationCategoryResponse): DisableNotificationCategoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisableNotificationCategoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisableNotificationCategoryResponse;
    static deserializeBinaryFromReader(message: DisableNotificationCategoryResponse, reader: jspb.BinaryReader): DisableNotificationCategoryResponse;
}

export namespace DisableNotificationCategoryResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class EnableNotificationCategoryRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): EnableNotificationCategoryRequest;
    getChannel(): NotificationChannel;
    setChannel(value: NotificationChannel): EnableNotificationCategoryRequest;
    getCategory(): NotificationCategory;
    setCategory(value: NotificationCategory): EnableNotificationCategoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationCategoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationCategoryRequest): EnableNotificationCategoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationCategoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationCategoryRequest;
    static deserializeBinaryFromReader(message: EnableNotificationCategoryRequest, reader: jspb.BinaryReader): EnableNotificationCategoryRequest;
}

export namespace EnableNotificationCategoryRequest {
    export type AsObject = {
        userId: string,
        channel: NotificationChannel,
        category: NotificationCategory,
    }
}

export class EnableNotificationCategoryResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): EnableNotificationCategoryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EnableNotificationCategoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EnableNotificationCategoryResponse): EnableNotificationCategoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EnableNotificationCategoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EnableNotificationCategoryResponse;
    static deserializeBinaryFromReader(message: EnableNotificationCategoryResponse, reader: jspb.BinaryReader): EnableNotificationCategoryResponse;
}

export namespace EnableNotificationCategoryResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class GetNotificationSettingsRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): GetNotificationSettingsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetNotificationSettingsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetNotificationSettingsRequest): GetNotificationSettingsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetNotificationSettingsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetNotificationSettingsRequest;
    static deserializeBinaryFromReader(message: GetNotificationSettingsRequest, reader: jspb.BinaryReader): GetNotificationSettingsRequest;
}

export namespace GetNotificationSettingsRequest {
    export type AsObject = {
        userId: string,
    }
}

export class GetNotificationSettingsResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): GetNotificationSettingsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetNotificationSettingsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetNotificationSettingsResponse): GetNotificationSettingsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetNotificationSettingsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetNotificationSettingsResponse;
    static deserializeBinaryFromReader(message: GetNotificationSettingsResponse, reader: jspb.BinaryReader): GetNotificationSettingsResponse;
}

export namespace GetNotificationSettingsResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
    }
}

export class UpdateUserLocaleRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): UpdateUserLocaleRequest;
    getLocale(): string;
    setLocale(value: string): UpdateUserLocaleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateUserLocaleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateUserLocaleRequest): UpdateUserLocaleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateUserLocaleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateUserLocaleRequest;
    static deserializeBinaryFromReader(message: UpdateUserLocaleRequest, reader: jspb.BinaryReader): UpdateUserLocaleRequest;
}

export namespace UpdateUserLocaleRequest {
    export type AsObject = {
        userId: string,
        locale: string,
    }
}

export class UpdateUserLocaleResponse extends jspb.Message { 

    hasNotificationSettings(): boolean;
    clearNotificationSettings(): void;
    getNotificationSettings(): NotificationSettings | undefined;
    setNotificationSettings(value?: NotificationSettings): UpdateUserLocaleResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateUserLocaleResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateUserLocaleResponse): UpdateUserLocaleResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateUserLocaleResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateUserLocaleResponse;
    static deserializeBinaryFromReader(message: UpdateUserLocaleResponse, reader: jspb.BinaryReader): UpdateUserLocaleResponse;
}

export namespace UpdateUserLocaleResponse {
    export type AsObject = {
        notificationSettings?: NotificationSettings.AsObject,
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
