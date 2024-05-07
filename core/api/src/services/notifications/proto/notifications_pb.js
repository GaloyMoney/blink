// source: notifications.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    (function () { return this; }).call(null) ||
    Function('return this')();

goog.exportSymbol('proto.services.notifications.v1.Action', null, global);
goog.exportSymbol('proto.services.notifications.v1.Action.DataCase', null, global);
goog.exportSymbol('proto.services.notifications.v1.AddPushDeviceTokenRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.AddPushDeviceTokenResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.ChannelNotificationSettings', null, global);
goog.exportSymbol('proto.services.notifications.v1.CircleGrew', null, global);
goog.exportSymbol('proto.services.notifications.v1.CircleThresholdReached', null, global);
goog.exportSymbol('proto.services.notifications.v1.CircleTimeFrame', null, global);
goog.exportSymbol('proto.services.notifications.v1.CircleType', null, global);
goog.exportSymbol('proto.services.notifications.v1.DeclinedReason', null, global);
goog.exportSymbol('proto.services.notifications.v1.DeepLink', null, global);
goog.exportSymbol('proto.services.notifications.v1.DeepLinkAction', null, global);
goog.exportSymbol('proto.services.notifications.v1.DeepLinkScreen', null, global);
goog.exportSymbol('proto.services.notifications.v1.DisableNotificationCategoryRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.DisableNotificationCategoryResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.DisableNotificationChannelRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.DisableNotificationChannelResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.EnableNotificationCategoryRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.EnableNotificationCategoryResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.EnableNotificationChannelRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.EnableNotificationChannelResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.GetNotificationSettingsRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.GetNotificationSettingsResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.HandleNotificationEventRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.HandleNotificationEventResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.IdentityVerificationApproved', null, global);
goog.exportSymbol('proto.services.notifications.v1.IdentityVerificationDeclined', null, global);
goog.exportSymbol('proto.services.notifications.v1.IdentityVerificationReviewStarted', null, global);
goog.exportSymbol('proto.services.notifications.v1.LocalizedContent', null, global);
goog.exportSymbol('proto.services.notifications.v1.MarketingNotificationTriggered', null, global);
goog.exportSymbol('proto.services.notifications.v1.Money', null, global);
goog.exportSymbol('proto.services.notifications.v1.NotificationCategory', null, global);
goog.exportSymbol('proto.services.notifications.v1.NotificationChannel', null, global);
goog.exportSymbol('proto.services.notifications.v1.NotificationEvent', null, global);
goog.exportSymbol('proto.services.notifications.v1.NotificationEvent.DataCase', null, global);
goog.exportSymbol('proto.services.notifications.v1.NotificationSettings', null, global);
goog.exportSymbol('proto.services.notifications.v1.PriceChangeDirection', null, global);
goog.exportSymbol('proto.services.notifications.v1.PriceChanged', null, global);
goog.exportSymbol('proto.services.notifications.v1.RemoveEmailAddressRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.RemoveEmailAddressResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.RemovePushDeviceTokenRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.RemovePushDeviceTokenResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.ShouldSendNotificationRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.ShouldSendNotificationResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.TransactionOccurred', null, global);
goog.exportSymbol('proto.services.notifications.v1.TransactionType', null, global);
goog.exportSymbol('proto.services.notifications.v1.UpdateEmailAddressRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.UpdateEmailAddressResponse', null, global);
goog.exportSymbol('proto.services.notifications.v1.UpdateUserLocaleRequest', null, global);
goog.exportSymbol('proto.services.notifications.v1.UpdateUserLocaleResponse', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.ShouldSendNotificationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.ShouldSendNotificationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.ShouldSendNotificationRequest.displayName = 'proto.services.notifications.v1.ShouldSendNotificationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.ShouldSendNotificationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.ShouldSendNotificationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.ShouldSendNotificationResponse.displayName = 'proto.services.notifications.v1.ShouldSendNotificationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.EnableNotificationChannelRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.EnableNotificationChannelRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.EnableNotificationChannelRequest.displayName = 'proto.services.notifications.v1.EnableNotificationChannelRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.EnableNotificationChannelResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.EnableNotificationChannelResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.EnableNotificationChannelResponse.displayName = 'proto.services.notifications.v1.EnableNotificationChannelResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.NotificationSettings = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.notifications.v1.NotificationSettings.repeatedFields_, null);
};
goog.inherits(proto.services.notifications.v1.NotificationSettings, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.NotificationSettings.displayName = 'proto.services.notifications.v1.NotificationSettings';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.ChannelNotificationSettings = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.notifications.v1.ChannelNotificationSettings.repeatedFields_, null);
};
goog.inherits(proto.services.notifications.v1.ChannelNotificationSettings, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.ChannelNotificationSettings.displayName = 'proto.services.notifications.v1.ChannelNotificationSettings';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.DisableNotificationChannelRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.DisableNotificationChannelRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.DisableNotificationChannelRequest.displayName = 'proto.services.notifications.v1.DisableNotificationChannelRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.DisableNotificationChannelResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.DisableNotificationChannelResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.DisableNotificationChannelResponse.displayName = 'proto.services.notifications.v1.DisableNotificationChannelResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.DisableNotificationCategoryRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.DisableNotificationCategoryRequest.displayName = 'proto.services.notifications.v1.DisableNotificationCategoryRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.DisableNotificationCategoryResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.DisableNotificationCategoryResponse.displayName = 'proto.services.notifications.v1.DisableNotificationCategoryResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.EnableNotificationCategoryRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.EnableNotificationCategoryRequest.displayName = 'proto.services.notifications.v1.EnableNotificationCategoryRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.EnableNotificationCategoryResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.EnableNotificationCategoryResponse.displayName = 'proto.services.notifications.v1.EnableNotificationCategoryResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.GetNotificationSettingsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.GetNotificationSettingsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.GetNotificationSettingsRequest.displayName = 'proto.services.notifications.v1.GetNotificationSettingsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.GetNotificationSettingsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.GetNotificationSettingsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.GetNotificationSettingsResponse.displayName = 'proto.services.notifications.v1.GetNotificationSettingsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.UpdateUserLocaleRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.UpdateUserLocaleRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.UpdateUserLocaleRequest.displayName = 'proto.services.notifications.v1.UpdateUserLocaleRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.UpdateUserLocaleResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.UpdateUserLocaleResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.UpdateUserLocaleResponse.displayName = 'proto.services.notifications.v1.UpdateUserLocaleResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.AddPushDeviceTokenRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.AddPushDeviceTokenRequest.displayName = 'proto.services.notifications.v1.AddPushDeviceTokenRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.AddPushDeviceTokenResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.AddPushDeviceTokenResponse.displayName = 'proto.services.notifications.v1.AddPushDeviceTokenResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.RemovePushDeviceTokenRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.RemovePushDeviceTokenRequest.displayName = 'proto.services.notifications.v1.RemovePushDeviceTokenRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.RemovePushDeviceTokenResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.RemovePushDeviceTokenResponse.displayName = 'proto.services.notifications.v1.RemovePushDeviceTokenResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.UpdateEmailAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.UpdateEmailAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.UpdateEmailAddressRequest.displayName = 'proto.services.notifications.v1.UpdateEmailAddressRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.UpdateEmailAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.UpdateEmailAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.UpdateEmailAddressResponse.displayName = 'proto.services.notifications.v1.UpdateEmailAddressResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.RemoveEmailAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.RemoveEmailAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.RemoveEmailAddressRequest.displayName = 'proto.services.notifications.v1.RemoveEmailAddressRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.RemoveEmailAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.RemoveEmailAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.RemoveEmailAddressResponse.displayName = 'proto.services.notifications.v1.RemoveEmailAddressResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.HandleNotificationEventRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.HandleNotificationEventRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.HandleNotificationEventRequest.displayName = 'proto.services.notifications.v1.HandleNotificationEventRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.HandleNotificationEventResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.HandleNotificationEventResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.HandleNotificationEventResponse.displayName = 'proto.services.notifications.v1.HandleNotificationEventResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.NotificationEvent = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.notifications.v1.NotificationEvent.oneofGroups_);
};
goog.inherits(proto.services.notifications.v1.NotificationEvent, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.NotificationEvent.displayName = 'proto.services.notifications.v1.NotificationEvent';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.CircleGrew = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.CircleGrew, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.CircleGrew.displayName = 'proto.services.notifications.v1.CircleGrew';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.CircleThresholdReached = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.CircleThresholdReached, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.CircleThresholdReached.displayName = 'proto.services.notifications.v1.CircleThresholdReached';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.IdentityVerificationApproved = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.IdentityVerificationApproved, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.IdentityVerificationApproved.displayName = 'proto.services.notifications.v1.IdentityVerificationApproved';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.IdentityVerificationDeclined = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.IdentityVerificationDeclined, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.IdentityVerificationDeclined.displayName = 'proto.services.notifications.v1.IdentityVerificationDeclined';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.IdentityVerificationReviewStarted, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.IdentityVerificationReviewStarted.displayName = 'proto.services.notifications.v1.IdentityVerificationReviewStarted';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.TransactionOccurred = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.TransactionOccurred, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.TransactionOccurred.displayName = 'proto.services.notifications.v1.TransactionOccurred';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.Money = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.Money, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.Money.displayName = 'proto.services.notifications.v1.Money';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.PriceChanged = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.PriceChanged, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.PriceChanged.displayName = 'proto.services.notifications.v1.PriceChanged';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.MarketingNotificationTriggered = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.notifications.v1.MarketingNotificationTriggered.repeatedFields_, null);
};
goog.inherits(proto.services.notifications.v1.MarketingNotificationTriggered, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.MarketingNotificationTriggered.displayName = 'proto.services.notifications.v1.MarketingNotificationTriggered';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.LocalizedContent = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.LocalizedContent, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.LocalizedContent.displayName = 'proto.services.notifications.v1.LocalizedContent';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.Action = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.notifications.v1.Action.oneofGroups_);
};
goog.inherits(proto.services.notifications.v1.Action, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.Action.displayName = 'proto.services.notifications.v1.Action';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.services.notifications.v1.DeepLink = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.notifications.v1.DeepLink, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.notifications.v1.DeepLink.displayName = 'proto.services.notifications.v1.DeepLink';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.ShouldSendNotificationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.ShouldSendNotificationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    channel: jspb.Message.getFieldWithDefault(msg, 2, 0),
    category: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.ShouldSendNotificationRequest}
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.ShouldSendNotificationRequest;
  return proto.services.notifications.v1.ShouldSendNotificationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.ShouldSendNotificationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.ShouldSendNotificationRequest}
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.NotificationChannel} */ (reader.readEnum());
      msg.setChannel(value);
      break;
    case 3:
      var value = /** @type {!proto.services.notifications.v1.NotificationCategory} */ (reader.readEnum());
      msg.setCategory(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.ShouldSendNotificationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.ShouldSendNotificationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChannel();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getCategory();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.ShouldSendNotificationRequest} returns this
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional NotificationChannel channel = 2;
 * @return {!proto.services.notifications.v1.NotificationChannel}
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.getChannel = function() {
  return /** @type {!proto.services.notifications.v1.NotificationChannel} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationChannel} value
 * @return {!proto.services.notifications.v1.ShouldSendNotificationRequest} returns this
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.setChannel = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional NotificationCategory category = 3;
 * @return {!proto.services.notifications.v1.NotificationCategory}
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.getCategory = function() {
  return /** @type {!proto.services.notifications.v1.NotificationCategory} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationCategory} value
 * @return {!proto.services.notifications.v1.ShouldSendNotificationRequest} returns this
 */
proto.services.notifications.v1.ShouldSendNotificationRequest.prototype.setCategory = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.ShouldSendNotificationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.ShouldSendNotificationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    shouldSend: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.ShouldSendNotificationResponse}
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.ShouldSendNotificationResponse;
  return proto.services.notifications.v1.ShouldSendNotificationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.ShouldSendNotificationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.ShouldSendNotificationResponse}
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setShouldSend(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.ShouldSendNotificationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.ShouldSendNotificationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getShouldSend();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.ShouldSendNotificationResponse} returns this
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bool should_send = 2;
 * @return {boolean}
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.prototype.getShouldSend = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.notifications.v1.ShouldSendNotificationResponse} returns this
 */
proto.services.notifications.v1.ShouldSendNotificationResponse.prototype.setShouldSend = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.EnableNotificationChannelRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.EnableNotificationChannelRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    channel: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.EnableNotificationChannelRequest}
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.EnableNotificationChannelRequest;
  return proto.services.notifications.v1.EnableNotificationChannelRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.EnableNotificationChannelRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.EnableNotificationChannelRequest}
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.NotificationChannel} */ (reader.readEnum());
      msg.setChannel(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.EnableNotificationChannelRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.EnableNotificationChannelRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChannel();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.EnableNotificationChannelRequest} returns this
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional NotificationChannel channel = 2;
 * @return {!proto.services.notifications.v1.NotificationChannel}
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.prototype.getChannel = function() {
  return /** @type {!proto.services.notifications.v1.NotificationChannel} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationChannel} value
 * @return {!proto.services.notifications.v1.EnableNotificationChannelRequest} returns this
 */
proto.services.notifications.v1.EnableNotificationChannelRequest.prototype.setChannel = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.EnableNotificationChannelResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.EnableNotificationChannelResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.EnableNotificationChannelResponse}
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.EnableNotificationChannelResponse;
  return proto.services.notifications.v1.EnableNotificationChannelResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.EnableNotificationChannelResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.EnableNotificationChannelResponse}
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.EnableNotificationChannelResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.EnableNotificationChannelResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.EnableNotificationChannelResponse} returns this
*/
proto.services.notifications.v1.EnableNotificationChannelResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.EnableNotificationChannelResponse} returns this
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.EnableNotificationChannelResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.notifications.v1.NotificationSettings.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.NotificationSettings.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.NotificationSettings.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.NotificationSettings} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.NotificationSettings.toObject = function(includeInstance, msg) {
  var f, obj = {
    push: (f = msg.getPush()) && proto.services.notifications.v1.ChannelNotificationSettings.toObject(includeInstance, f),
    locale: jspb.Message.getFieldWithDefault(msg, 2, ""),
    pushDeviceTokensList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.NotificationSettings.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.NotificationSettings;
  return proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.NotificationSettings} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.ChannelNotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.ChannelNotificationSettings.deserializeBinaryFromReader);
      msg.setPush(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setLocale(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.addPushDeviceTokens(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.NotificationSettings.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.NotificationSettings} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPush();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.ChannelNotificationSettings.serializeBinaryToWriter
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getPushDeviceTokensList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
};


/**
 * optional ChannelNotificationSettings push = 1;
 * @return {?proto.services.notifications.v1.ChannelNotificationSettings}
 */
proto.services.notifications.v1.NotificationSettings.prototype.getPush = function() {
  return /** @type{?proto.services.notifications.v1.ChannelNotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.ChannelNotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.ChannelNotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.NotificationSettings} returns this
*/
proto.services.notifications.v1.NotificationSettings.prototype.setPush = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationSettings} returns this
 */
proto.services.notifications.v1.NotificationSettings.prototype.clearPush = function() {
  return this.setPush(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationSettings.prototype.hasPush = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string locale = 2;
 * @return {string}
 */
proto.services.notifications.v1.NotificationSettings.prototype.getLocale = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.NotificationSettings} returns this
 */
proto.services.notifications.v1.NotificationSettings.prototype.setLocale = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationSettings} returns this
 */
proto.services.notifications.v1.NotificationSettings.prototype.clearLocale = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationSettings.prototype.hasLocale = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * repeated string push_device_tokens = 3;
 * @return {!Array<string>}
 */
proto.services.notifications.v1.NotificationSettings.prototype.getPushDeviceTokensList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.services.notifications.v1.NotificationSettings} returns this
 */
proto.services.notifications.v1.NotificationSettings.prototype.setPushDeviceTokensList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.services.notifications.v1.NotificationSettings} returns this
 */
proto.services.notifications.v1.NotificationSettings.prototype.addPushDeviceTokens = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.notifications.v1.NotificationSettings} returns this
 */
proto.services.notifications.v1.NotificationSettings.prototype.clearPushDeviceTokensList = function() {
  return this.setPushDeviceTokensList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.notifications.v1.ChannelNotificationSettings.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.ChannelNotificationSettings.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.ChannelNotificationSettings} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.ChannelNotificationSettings.toObject = function(includeInstance, msg) {
  var f, obj = {
    enabled: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    disabledCategoriesList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.ChannelNotificationSettings}
 */
proto.services.notifications.v1.ChannelNotificationSettings.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.ChannelNotificationSettings;
  return proto.services.notifications.v1.ChannelNotificationSettings.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.ChannelNotificationSettings} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.ChannelNotificationSettings}
 */
proto.services.notifications.v1.ChannelNotificationSettings.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEnabled(value);
      break;
    case 2:
      var values = /** @type {!Array<!proto.services.notifications.v1.NotificationCategory>} */ (reader.isDelimited() ? reader.readPackedEnum() : [reader.readEnum()]);
      for (var i = 0; i < values.length; i++) {
        msg.addDisabledCategories(values[i]);
      }
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.ChannelNotificationSettings.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.ChannelNotificationSettings} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.ChannelNotificationSettings.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEnabled();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getDisabledCategoriesList();
  if (f.length > 0) {
    writer.writePackedEnum(
      2,
      f
    );
  }
};


/**
 * optional bool enabled = 1;
 * @return {boolean}
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.getEnabled = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.notifications.v1.ChannelNotificationSettings} returns this
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.setEnabled = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * repeated NotificationCategory disabled_categories = 2;
 * @return {!Array<!proto.services.notifications.v1.NotificationCategory>}
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.getDisabledCategoriesList = function() {
  return /** @type {!Array<!proto.services.notifications.v1.NotificationCategory>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<!proto.services.notifications.v1.NotificationCategory>} value
 * @return {!proto.services.notifications.v1.ChannelNotificationSettings} returns this
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.setDisabledCategoriesList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {!proto.services.notifications.v1.NotificationCategory} value
 * @param {number=} opt_index
 * @return {!proto.services.notifications.v1.ChannelNotificationSettings} returns this
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.addDisabledCategories = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.notifications.v1.ChannelNotificationSettings} returns this
 */
proto.services.notifications.v1.ChannelNotificationSettings.prototype.clearDisabledCategoriesList = function() {
  return this.setDisabledCategoriesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.DisableNotificationChannelRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.DisableNotificationChannelRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    channel: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.DisableNotificationChannelRequest}
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.DisableNotificationChannelRequest;
  return proto.services.notifications.v1.DisableNotificationChannelRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.DisableNotificationChannelRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.DisableNotificationChannelRequest}
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.NotificationChannel} */ (reader.readEnum());
      msg.setChannel(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.DisableNotificationChannelRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.DisableNotificationChannelRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChannel();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.DisableNotificationChannelRequest} returns this
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional NotificationChannel channel = 2;
 * @return {!proto.services.notifications.v1.NotificationChannel}
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.prototype.getChannel = function() {
  return /** @type {!proto.services.notifications.v1.NotificationChannel} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationChannel} value
 * @return {!proto.services.notifications.v1.DisableNotificationChannelRequest} returns this
 */
proto.services.notifications.v1.DisableNotificationChannelRequest.prototype.setChannel = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.DisableNotificationChannelResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.DisableNotificationChannelResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.DisableNotificationChannelResponse}
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.DisableNotificationChannelResponse;
  return proto.services.notifications.v1.DisableNotificationChannelResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.DisableNotificationChannelResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.DisableNotificationChannelResponse}
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.DisableNotificationChannelResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.DisableNotificationChannelResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.DisableNotificationChannelResponse} returns this
*/
proto.services.notifications.v1.DisableNotificationChannelResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.DisableNotificationChannelResponse} returns this
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.DisableNotificationChannelResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.DisableNotificationCategoryRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.DisableNotificationCategoryRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    channel: jspb.Message.getFieldWithDefault(msg, 2, 0),
    category: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryRequest}
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.DisableNotificationCategoryRequest;
  return proto.services.notifications.v1.DisableNotificationCategoryRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.DisableNotificationCategoryRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryRequest}
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.NotificationChannel} */ (reader.readEnum());
      msg.setChannel(value);
      break;
    case 3:
      var value = /** @type {!proto.services.notifications.v1.NotificationCategory} */ (reader.readEnum());
      msg.setCategory(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.DisableNotificationCategoryRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.DisableNotificationCategoryRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChannel();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getCategory();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryRequest} returns this
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional NotificationChannel channel = 2;
 * @return {!proto.services.notifications.v1.NotificationChannel}
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.getChannel = function() {
  return /** @type {!proto.services.notifications.v1.NotificationChannel} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationChannel} value
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryRequest} returns this
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.setChannel = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional NotificationCategory category = 3;
 * @return {!proto.services.notifications.v1.NotificationCategory}
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.getCategory = function() {
  return /** @type {!proto.services.notifications.v1.NotificationCategory} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationCategory} value
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryRequest} returns this
 */
proto.services.notifications.v1.DisableNotificationCategoryRequest.prototype.setCategory = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.DisableNotificationCategoryResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.DisableNotificationCategoryResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryResponse}
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.DisableNotificationCategoryResponse;
  return proto.services.notifications.v1.DisableNotificationCategoryResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.DisableNotificationCategoryResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryResponse}
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.DisableNotificationCategoryResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.DisableNotificationCategoryResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryResponse} returns this
*/
proto.services.notifications.v1.DisableNotificationCategoryResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.DisableNotificationCategoryResponse} returns this
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.DisableNotificationCategoryResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.EnableNotificationCategoryRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.EnableNotificationCategoryRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    channel: jspb.Message.getFieldWithDefault(msg, 2, 0),
    category: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryRequest}
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.EnableNotificationCategoryRequest;
  return proto.services.notifications.v1.EnableNotificationCategoryRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.EnableNotificationCategoryRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryRequest}
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.NotificationChannel} */ (reader.readEnum());
      msg.setChannel(value);
      break;
    case 3:
      var value = /** @type {!proto.services.notifications.v1.NotificationCategory} */ (reader.readEnum());
      msg.setCategory(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.EnableNotificationCategoryRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.EnableNotificationCategoryRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getChannel();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getCategory();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryRequest} returns this
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional NotificationChannel channel = 2;
 * @return {!proto.services.notifications.v1.NotificationChannel}
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.getChannel = function() {
  return /** @type {!proto.services.notifications.v1.NotificationChannel} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationChannel} value
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryRequest} returns this
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.setChannel = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional NotificationCategory category = 3;
 * @return {!proto.services.notifications.v1.NotificationCategory}
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.getCategory = function() {
  return /** @type {!proto.services.notifications.v1.NotificationCategory} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.services.notifications.v1.NotificationCategory} value
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryRequest} returns this
 */
proto.services.notifications.v1.EnableNotificationCategoryRequest.prototype.setCategory = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.EnableNotificationCategoryResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.EnableNotificationCategoryResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryResponse}
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.EnableNotificationCategoryResponse;
  return proto.services.notifications.v1.EnableNotificationCategoryResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.EnableNotificationCategoryResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryResponse}
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.EnableNotificationCategoryResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.EnableNotificationCategoryResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryResponse} returns this
*/
proto.services.notifications.v1.EnableNotificationCategoryResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.EnableNotificationCategoryResponse} returns this
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.EnableNotificationCategoryResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.GetNotificationSettingsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.GetNotificationSettingsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.GetNotificationSettingsRequest}
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.GetNotificationSettingsRequest;
  return proto.services.notifications.v1.GetNotificationSettingsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.GetNotificationSettingsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.GetNotificationSettingsRequest}
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.GetNotificationSettingsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.GetNotificationSettingsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.GetNotificationSettingsRequest} returns this
 */
proto.services.notifications.v1.GetNotificationSettingsRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.GetNotificationSettingsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.GetNotificationSettingsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.GetNotificationSettingsResponse}
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.GetNotificationSettingsResponse;
  return proto.services.notifications.v1.GetNotificationSettingsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.GetNotificationSettingsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.GetNotificationSettingsResponse}
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.GetNotificationSettingsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.GetNotificationSettingsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.GetNotificationSettingsResponse} returns this
*/
proto.services.notifications.v1.GetNotificationSettingsResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.GetNotificationSettingsResponse} returns this
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.GetNotificationSettingsResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.UpdateUserLocaleRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.UpdateUserLocaleRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    locale: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.UpdateUserLocaleRequest}
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.UpdateUserLocaleRequest;
  return proto.services.notifications.v1.UpdateUserLocaleRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.UpdateUserLocaleRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.UpdateUserLocaleRequest}
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setLocale(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.UpdateUserLocaleRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.UpdateUserLocaleRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLocale();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.UpdateUserLocaleRequest} returns this
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string locale = 2;
 * @return {string}
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.prototype.getLocale = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.UpdateUserLocaleRequest} returns this
 */
proto.services.notifications.v1.UpdateUserLocaleRequest.prototype.setLocale = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.UpdateUserLocaleResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.UpdateUserLocaleResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.UpdateUserLocaleResponse}
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.UpdateUserLocaleResponse;
  return proto.services.notifications.v1.UpdateUserLocaleResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.UpdateUserLocaleResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.UpdateUserLocaleResponse}
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.UpdateUserLocaleResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.UpdateUserLocaleResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.UpdateUserLocaleResponse} returns this
*/
proto.services.notifications.v1.UpdateUserLocaleResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.UpdateUserLocaleResponse} returns this
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.UpdateUserLocaleResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.AddPushDeviceTokenRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.AddPushDeviceTokenRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    deviceToken: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenRequest}
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.AddPushDeviceTokenRequest;
  return proto.services.notifications.v1.AddPushDeviceTokenRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.AddPushDeviceTokenRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenRequest}
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDeviceToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.AddPushDeviceTokenRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.AddPushDeviceTokenRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDeviceToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenRequest} returns this
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string device_token = 2;
 * @return {string}
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.prototype.getDeviceToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenRequest} returns this
 */
proto.services.notifications.v1.AddPushDeviceTokenRequest.prototype.setDeviceToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.AddPushDeviceTokenResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.AddPushDeviceTokenResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenResponse}
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.AddPushDeviceTokenResponse;
  return proto.services.notifications.v1.AddPushDeviceTokenResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.AddPushDeviceTokenResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenResponse}
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.AddPushDeviceTokenResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.AddPushDeviceTokenResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenResponse} returns this
*/
proto.services.notifications.v1.AddPushDeviceTokenResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.AddPushDeviceTokenResponse} returns this
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.AddPushDeviceTokenResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.RemovePushDeviceTokenRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.RemovePushDeviceTokenRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    deviceToken: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenRequest}
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.RemovePushDeviceTokenRequest;
  return proto.services.notifications.v1.RemovePushDeviceTokenRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.RemovePushDeviceTokenRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenRequest}
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDeviceToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.RemovePushDeviceTokenRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.RemovePushDeviceTokenRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDeviceToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenRequest} returns this
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string device_token = 2;
 * @return {string}
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.prototype.getDeviceToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenRequest} returns this
 */
proto.services.notifications.v1.RemovePushDeviceTokenRequest.prototype.setDeviceToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.RemovePushDeviceTokenResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.RemovePushDeviceTokenResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    notificationSettings: (f = msg.getNotificationSettings()) && proto.services.notifications.v1.NotificationSettings.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenResponse}
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.RemovePushDeviceTokenResponse;
  return proto.services.notifications.v1.RemovePushDeviceTokenResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.RemovePushDeviceTokenResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenResponse}
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationSettings;
      reader.readMessage(value,proto.services.notifications.v1.NotificationSettings.deserializeBinaryFromReader);
      msg.setNotificationSettings(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.RemovePushDeviceTokenResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.RemovePushDeviceTokenResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNotificationSettings();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationSettings.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationSettings notification_settings = 1;
 * @return {?proto.services.notifications.v1.NotificationSettings}
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.prototype.getNotificationSettings = function() {
  return /** @type{?proto.services.notifications.v1.NotificationSettings} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationSettings, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationSettings|undefined} value
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenResponse} returns this
*/
proto.services.notifications.v1.RemovePushDeviceTokenResponse.prototype.setNotificationSettings = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.RemovePushDeviceTokenResponse} returns this
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.prototype.clearNotificationSettings = function() {
  return this.setNotificationSettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.RemovePushDeviceTokenResponse.prototype.hasNotificationSettings = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.UpdateEmailAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.UpdateEmailAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    emailAddress: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.UpdateEmailAddressRequest}
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.UpdateEmailAddressRequest;
  return proto.services.notifications.v1.UpdateEmailAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.UpdateEmailAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.UpdateEmailAddressRequest}
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmailAddress(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.UpdateEmailAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.UpdateEmailAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getEmailAddress();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.UpdateEmailAddressRequest} returns this
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string email_address = 2;
 * @return {string}
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.prototype.getEmailAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.UpdateEmailAddressRequest} returns this
 */
proto.services.notifications.v1.UpdateEmailAddressRequest.prototype.setEmailAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.UpdateEmailAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.UpdateEmailAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.UpdateEmailAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateEmailAddressResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.UpdateEmailAddressResponse}
 */
proto.services.notifications.v1.UpdateEmailAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.UpdateEmailAddressResponse;
  return proto.services.notifications.v1.UpdateEmailAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.UpdateEmailAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.UpdateEmailAddressResponse}
 */
proto.services.notifications.v1.UpdateEmailAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.UpdateEmailAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.UpdateEmailAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.UpdateEmailAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.UpdateEmailAddressResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.RemoveEmailAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.RemoveEmailAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.RemoveEmailAddressRequest}
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.RemoveEmailAddressRequest;
  return proto.services.notifications.v1.RemoveEmailAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.RemoveEmailAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.RemoveEmailAddressRequest}
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.RemoveEmailAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.RemoveEmailAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.RemoveEmailAddressRequest} returns this
 */
proto.services.notifications.v1.RemoveEmailAddressRequest.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.RemoveEmailAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.RemoveEmailAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.RemoveEmailAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemoveEmailAddressResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.RemoveEmailAddressResponse}
 */
proto.services.notifications.v1.RemoveEmailAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.RemoveEmailAddressResponse;
  return proto.services.notifications.v1.RemoveEmailAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.RemoveEmailAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.RemoveEmailAddressResponse}
 */
proto.services.notifications.v1.RemoveEmailAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.RemoveEmailAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.RemoveEmailAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.RemoveEmailAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.RemoveEmailAddressResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.HandleNotificationEventRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.HandleNotificationEventRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.HandleNotificationEventRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.HandleNotificationEventRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    event: (f = msg.getEvent()) && proto.services.notifications.v1.NotificationEvent.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.HandleNotificationEventRequest}
 */
proto.services.notifications.v1.HandleNotificationEventRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.HandleNotificationEventRequest;
  return proto.services.notifications.v1.HandleNotificationEventRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.HandleNotificationEventRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.HandleNotificationEventRequest}
 */
proto.services.notifications.v1.HandleNotificationEventRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.NotificationEvent;
      reader.readMessage(value,proto.services.notifications.v1.NotificationEvent.deserializeBinaryFromReader);
      msg.setEvent(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.HandleNotificationEventRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.HandleNotificationEventRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.HandleNotificationEventRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.HandleNotificationEventRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEvent();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.NotificationEvent.serializeBinaryToWriter
    );
  }
};


/**
 * optional NotificationEvent event = 1;
 * @return {?proto.services.notifications.v1.NotificationEvent}
 */
proto.services.notifications.v1.HandleNotificationEventRequest.prototype.getEvent = function() {
  return /** @type{?proto.services.notifications.v1.NotificationEvent} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.NotificationEvent, 1));
};


/**
 * @param {?proto.services.notifications.v1.NotificationEvent|undefined} value
 * @return {!proto.services.notifications.v1.HandleNotificationEventRequest} returns this
*/
proto.services.notifications.v1.HandleNotificationEventRequest.prototype.setEvent = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.HandleNotificationEventRequest} returns this
 */
proto.services.notifications.v1.HandleNotificationEventRequest.prototype.clearEvent = function() {
  return this.setEvent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.HandleNotificationEventRequest.prototype.hasEvent = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.HandleNotificationEventResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.HandleNotificationEventResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.HandleNotificationEventResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.HandleNotificationEventResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.HandleNotificationEventResponse}
 */
proto.services.notifications.v1.HandleNotificationEventResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.HandleNotificationEventResponse;
  return proto.services.notifications.v1.HandleNotificationEventResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.HandleNotificationEventResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.HandleNotificationEventResponse}
 */
proto.services.notifications.v1.HandleNotificationEventResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.HandleNotificationEventResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.HandleNotificationEventResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.HandleNotificationEventResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.HandleNotificationEventResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.notifications.v1.NotificationEvent.oneofGroups_ = [[1,2,3,4,5,6,7,8]];

/**
 * @enum {number}
 */
proto.services.notifications.v1.NotificationEvent.DataCase = {
  DATA_NOT_SET: 0,
  CIRCLE_GREW: 1,
  CIRCLE_THRESHOLD_REACHED: 2,
  IDENTITY_VERIFICATION_APPROVED: 3,
  IDENTITY_VERIFICATION_DECLINED: 4,
  IDENTITY_VERIFICATION_REVIEW_STARTED: 5,
  TRANSACTION_OCCURRED: 6,
  PRICE: 7,
  MARKETING_NOTIFICATION_TRIGGERED: 8
};

/**
 * @return {proto.services.notifications.v1.NotificationEvent.DataCase}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getDataCase = function() {
  return /** @type {proto.services.notifications.v1.NotificationEvent.DataCase} */(jspb.Message.computeOneofCase(this, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.NotificationEvent.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.NotificationEvent.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.NotificationEvent} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.NotificationEvent.toObject = function(includeInstance, msg) {
  var f, obj = {
    circleGrew: (f = msg.getCircleGrew()) && proto.services.notifications.v1.CircleGrew.toObject(includeInstance, f),
    circleThresholdReached: (f = msg.getCircleThresholdReached()) && proto.services.notifications.v1.CircleThresholdReached.toObject(includeInstance, f),
    identityVerificationApproved: (f = msg.getIdentityVerificationApproved()) && proto.services.notifications.v1.IdentityVerificationApproved.toObject(includeInstance, f),
    identityVerificationDeclined: (f = msg.getIdentityVerificationDeclined()) && proto.services.notifications.v1.IdentityVerificationDeclined.toObject(includeInstance, f),
    identityVerificationReviewStarted: (f = msg.getIdentityVerificationReviewStarted()) && proto.services.notifications.v1.IdentityVerificationReviewStarted.toObject(includeInstance, f),
    transactionOccurred: (f = msg.getTransactionOccurred()) && proto.services.notifications.v1.TransactionOccurred.toObject(includeInstance, f),
    price: (f = msg.getPrice()) && proto.services.notifications.v1.PriceChanged.toObject(includeInstance, f),
    marketingNotificationTriggered: (f = msg.getMarketingNotificationTriggered()) && proto.services.notifications.v1.MarketingNotificationTriggered.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.NotificationEvent}
 */
proto.services.notifications.v1.NotificationEvent.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.NotificationEvent;
  return proto.services.notifications.v1.NotificationEvent.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.NotificationEvent} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.NotificationEvent}
 */
proto.services.notifications.v1.NotificationEvent.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.CircleGrew;
      reader.readMessage(value,proto.services.notifications.v1.CircleGrew.deserializeBinaryFromReader);
      msg.setCircleGrew(value);
      break;
    case 2:
      var value = new proto.services.notifications.v1.CircleThresholdReached;
      reader.readMessage(value,proto.services.notifications.v1.CircleThresholdReached.deserializeBinaryFromReader);
      msg.setCircleThresholdReached(value);
      break;
    case 3:
      var value = new proto.services.notifications.v1.IdentityVerificationApproved;
      reader.readMessage(value,proto.services.notifications.v1.IdentityVerificationApproved.deserializeBinaryFromReader);
      msg.setIdentityVerificationApproved(value);
      break;
    case 4:
      var value = new proto.services.notifications.v1.IdentityVerificationDeclined;
      reader.readMessage(value,proto.services.notifications.v1.IdentityVerificationDeclined.deserializeBinaryFromReader);
      msg.setIdentityVerificationDeclined(value);
      break;
    case 5:
      var value = new proto.services.notifications.v1.IdentityVerificationReviewStarted;
      reader.readMessage(value,proto.services.notifications.v1.IdentityVerificationReviewStarted.deserializeBinaryFromReader);
      msg.setIdentityVerificationReviewStarted(value);
      break;
    case 6:
      var value = new proto.services.notifications.v1.TransactionOccurred;
      reader.readMessage(value,proto.services.notifications.v1.TransactionOccurred.deserializeBinaryFromReader);
      msg.setTransactionOccurred(value);
      break;
    case 7:
      var value = new proto.services.notifications.v1.PriceChanged;
      reader.readMessage(value,proto.services.notifications.v1.PriceChanged.deserializeBinaryFromReader);
      msg.setPrice(value);
      break;
    case 8:
      var value = new proto.services.notifications.v1.MarketingNotificationTriggered;
      reader.readMessage(value,proto.services.notifications.v1.MarketingNotificationTriggered.deserializeBinaryFromReader);
      msg.setMarketingNotificationTriggered(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.NotificationEvent.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.NotificationEvent.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.NotificationEvent} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.NotificationEvent.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCircleGrew();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.CircleGrew.serializeBinaryToWriter
    );
  }
  f = message.getCircleThresholdReached();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.services.notifications.v1.CircleThresholdReached.serializeBinaryToWriter
    );
  }
  f = message.getIdentityVerificationApproved();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.notifications.v1.IdentityVerificationApproved.serializeBinaryToWriter
    );
  }
  f = message.getIdentityVerificationDeclined();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.services.notifications.v1.IdentityVerificationDeclined.serializeBinaryToWriter
    );
  }
  f = message.getIdentityVerificationReviewStarted();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.services.notifications.v1.IdentityVerificationReviewStarted.serializeBinaryToWriter
    );
  }
  f = message.getTransactionOccurred();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.services.notifications.v1.TransactionOccurred.serializeBinaryToWriter
    );
  }
  f = message.getPrice();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.services.notifications.v1.PriceChanged.serializeBinaryToWriter
    );
  }
  f = message.getMarketingNotificationTriggered();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      proto.services.notifications.v1.MarketingNotificationTriggered.serializeBinaryToWriter
    );
  }
};


/**
 * optional CircleGrew circle_grew = 1;
 * @return {?proto.services.notifications.v1.CircleGrew}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getCircleGrew = function() {
  return /** @type{?proto.services.notifications.v1.CircleGrew} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.CircleGrew, 1));
};


/**
 * @param {?proto.services.notifications.v1.CircleGrew|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setCircleGrew = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearCircleGrew = function() {
  return this.setCircleGrew(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasCircleGrew = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional CircleThresholdReached circle_threshold_reached = 2;
 * @return {?proto.services.notifications.v1.CircleThresholdReached}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getCircleThresholdReached = function() {
  return /** @type{?proto.services.notifications.v1.CircleThresholdReached} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.CircleThresholdReached, 2));
};


/**
 * @param {?proto.services.notifications.v1.CircleThresholdReached|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setCircleThresholdReached = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearCircleThresholdReached = function() {
  return this.setCircleThresholdReached(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasCircleThresholdReached = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional IdentityVerificationApproved identity_verification_approved = 3;
 * @return {?proto.services.notifications.v1.IdentityVerificationApproved}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getIdentityVerificationApproved = function() {
  return /** @type{?proto.services.notifications.v1.IdentityVerificationApproved} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.IdentityVerificationApproved, 3));
};


/**
 * @param {?proto.services.notifications.v1.IdentityVerificationApproved|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setIdentityVerificationApproved = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearIdentityVerificationApproved = function() {
  return this.setIdentityVerificationApproved(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasIdentityVerificationApproved = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional IdentityVerificationDeclined identity_verification_declined = 4;
 * @return {?proto.services.notifications.v1.IdentityVerificationDeclined}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getIdentityVerificationDeclined = function() {
  return /** @type{?proto.services.notifications.v1.IdentityVerificationDeclined} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.IdentityVerificationDeclined, 4));
};


/**
 * @param {?proto.services.notifications.v1.IdentityVerificationDeclined|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setIdentityVerificationDeclined = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearIdentityVerificationDeclined = function() {
  return this.setIdentityVerificationDeclined(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasIdentityVerificationDeclined = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional IdentityVerificationReviewStarted identity_verification_review_started = 5;
 * @return {?proto.services.notifications.v1.IdentityVerificationReviewStarted}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getIdentityVerificationReviewStarted = function() {
  return /** @type{?proto.services.notifications.v1.IdentityVerificationReviewStarted} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.IdentityVerificationReviewStarted, 5));
};


/**
 * @param {?proto.services.notifications.v1.IdentityVerificationReviewStarted|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setIdentityVerificationReviewStarted = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearIdentityVerificationReviewStarted = function() {
  return this.setIdentityVerificationReviewStarted(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasIdentityVerificationReviewStarted = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional TransactionOccurred transaction_occurred = 6;
 * @return {?proto.services.notifications.v1.TransactionOccurred}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getTransactionOccurred = function() {
  return /** @type{?proto.services.notifications.v1.TransactionOccurred} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.TransactionOccurred, 6));
};


/**
 * @param {?proto.services.notifications.v1.TransactionOccurred|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setTransactionOccurred = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearTransactionOccurred = function() {
  return this.setTransactionOccurred(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasTransactionOccurred = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional PriceChanged price = 7;
 * @return {?proto.services.notifications.v1.PriceChanged}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getPrice = function() {
  return /** @type{?proto.services.notifications.v1.PriceChanged} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.PriceChanged, 7));
};


/**
 * @param {?proto.services.notifications.v1.PriceChanged|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setPrice = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearPrice = function() {
  return this.setPrice(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasPrice = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional MarketingNotificationTriggered marketing_notification_triggered = 8;
 * @return {?proto.services.notifications.v1.MarketingNotificationTriggered}
 */
proto.services.notifications.v1.NotificationEvent.prototype.getMarketingNotificationTriggered = function() {
  return /** @type{?proto.services.notifications.v1.MarketingNotificationTriggered} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.MarketingNotificationTriggered, 8));
};


/**
 * @param {?proto.services.notifications.v1.MarketingNotificationTriggered|undefined} value
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
*/
proto.services.notifications.v1.NotificationEvent.prototype.setMarketingNotificationTriggered = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.services.notifications.v1.NotificationEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.NotificationEvent} returns this
 */
proto.services.notifications.v1.NotificationEvent.prototype.clearMarketingNotificationTriggered = function() {
  return this.setMarketingNotificationTriggered(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.NotificationEvent.prototype.hasMarketingNotificationTriggered = function() {
  return jspb.Message.getField(this, 8) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.CircleGrew.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.CircleGrew.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.CircleGrew} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.CircleGrew.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    circleType: jspb.Message.getFieldWithDefault(msg, 2, 0),
    thisMonthCircleSize: jspb.Message.getFieldWithDefault(msg, 3, 0),
    allTimeCircleSize: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.CircleGrew}
 */
proto.services.notifications.v1.CircleGrew.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.CircleGrew;
  return proto.services.notifications.v1.CircleGrew.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.CircleGrew} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.CircleGrew}
 */
proto.services.notifications.v1.CircleGrew.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.CircleType} */ (reader.readEnum());
      msg.setCircleType(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setThisMonthCircleSize(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setAllTimeCircleSize(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.CircleGrew.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.CircleGrew.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.CircleGrew} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.CircleGrew.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getCircleType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getThisMonthCircleSize();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getAllTimeCircleSize();
  if (f !== 0) {
    writer.writeUint32(
      4,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.CircleGrew.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.CircleGrew} returns this
 */
proto.services.notifications.v1.CircleGrew.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional CircleType circle_type = 2;
 * @return {!proto.services.notifications.v1.CircleType}
 */
proto.services.notifications.v1.CircleGrew.prototype.getCircleType = function() {
  return /** @type {!proto.services.notifications.v1.CircleType} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.CircleType} value
 * @return {!proto.services.notifications.v1.CircleGrew} returns this
 */
proto.services.notifications.v1.CircleGrew.prototype.setCircleType = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional uint32 this_month_circle_size = 3;
 * @return {number}
 */
proto.services.notifications.v1.CircleGrew.prototype.getThisMonthCircleSize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.notifications.v1.CircleGrew} returns this
 */
proto.services.notifications.v1.CircleGrew.prototype.setThisMonthCircleSize = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint32 all_time_circle_size = 4;
 * @return {number}
 */
proto.services.notifications.v1.CircleGrew.prototype.getAllTimeCircleSize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.notifications.v1.CircleGrew} returns this
 */
proto.services.notifications.v1.CircleGrew.prototype.setAllTimeCircleSize = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.CircleThresholdReached.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.CircleThresholdReached} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.CircleThresholdReached.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    circleType: jspb.Message.getFieldWithDefault(msg, 2, 0),
    timeFrame: jspb.Message.getFieldWithDefault(msg, 3, 0),
    threshold: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.CircleThresholdReached}
 */
proto.services.notifications.v1.CircleThresholdReached.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.CircleThresholdReached;
  return proto.services.notifications.v1.CircleThresholdReached.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.CircleThresholdReached} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.CircleThresholdReached}
 */
proto.services.notifications.v1.CircleThresholdReached.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.CircleType} */ (reader.readEnum());
      msg.setCircleType(value);
      break;
    case 3:
      var value = /** @type {!proto.services.notifications.v1.CircleTimeFrame} */ (reader.readEnum());
      msg.setTimeFrame(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setThreshold(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.CircleThresholdReached.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.CircleThresholdReached} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.CircleThresholdReached.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getCircleType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getTimeFrame();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
  f = message.getThreshold();
  if (f !== 0) {
    writer.writeUint32(
      4,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.CircleThresholdReached} returns this
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional CircleType circle_type = 2;
 * @return {!proto.services.notifications.v1.CircleType}
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.getCircleType = function() {
  return /** @type {!proto.services.notifications.v1.CircleType} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.CircleType} value
 * @return {!proto.services.notifications.v1.CircleThresholdReached} returns this
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.setCircleType = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional CircleTimeFrame time_frame = 3;
 * @return {!proto.services.notifications.v1.CircleTimeFrame}
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.getTimeFrame = function() {
  return /** @type {!proto.services.notifications.v1.CircleTimeFrame} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.services.notifications.v1.CircleTimeFrame} value
 * @return {!proto.services.notifications.v1.CircleThresholdReached} returns this
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.setTimeFrame = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};


/**
 * optional uint32 threshold = 4;
 * @return {number}
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.getThreshold = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.notifications.v1.CircleThresholdReached} returns this
 */
proto.services.notifications.v1.CircleThresholdReached.prototype.setThreshold = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.IdentityVerificationApproved.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.IdentityVerificationApproved.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.IdentityVerificationApproved} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.IdentityVerificationApproved.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.IdentityVerificationApproved}
 */
proto.services.notifications.v1.IdentityVerificationApproved.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.IdentityVerificationApproved;
  return proto.services.notifications.v1.IdentityVerificationApproved.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.IdentityVerificationApproved} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.IdentityVerificationApproved}
 */
proto.services.notifications.v1.IdentityVerificationApproved.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.IdentityVerificationApproved.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.IdentityVerificationApproved.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.IdentityVerificationApproved} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.IdentityVerificationApproved.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.IdentityVerificationApproved.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.IdentityVerificationApproved} returns this
 */
proto.services.notifications.v1.IdentityVerificationApproved.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.IdentityVerificationDeclined.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.IdentityVerificationDeclined.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.IdentityVerificationDeclined} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.IdentityVerificationDeclined.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    declinedReason: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.IdentityVerificationDeclined}
 */
proto.services.notifications.v1.IdentityVerificationDeclined.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.IdentityVerificationDeclined;
  return proto.services.notifications.v1.IdentityVerificationDeclined.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.IdentityVerificationDeclined} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.IdentityVerificationDeclined}
 */
proto.services.notifications.v1.IdentityVerificationDeclined.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.DeclinedReason} */ (reader.readEnum());
      msg.setDeclinedReason(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.IdentityVerificationDeclined.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.IdentityVerificationDeclined.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.IdentityVerificationDeclined} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.IdentityVerificationDeclined.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDeclinedReason();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.IdentityVerificationDeclined.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.IdentityVerificationDeclined} returns this
 */
proto.services.notifications.v1.IdentityVerificationDeclined.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional DeclinedReason declined_reason = 2;
 * @return {!proto.services.notifications.v1.DeclinedReason}
 */
proto.services.notifications.v1.IdentityVerificationDeclined.prototype.getDeclinedReason = function() {
  return /** @type {!proto.services.notifications.v1.DeclinedReason} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.DeclinedReason} value
 * @return {!proto.services.notifications.v1.IdentityVerificationDeclined} returns this
 */
proto.services.notifications.v1.IdentityVerificationDeclined.prototype.setDeclinedReason = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.IdentityVerificationReviewStarted.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.IdentityVerificationReviewStarted} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.IdentityVerificationReviewStarted}
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.IdentityVerificationReviewStarted;
  return proto.services.notifications.v1.IdentityVerificationReviewStarted.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.IdentityVerificationReviewStarted} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.IdentityVerificationReviewStarted}
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.IdentityVerificationReviewStarted.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.IdentityVerificationReviewStarted} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.IdentityVerificationReviewStarted} returns this
 */
proto.services.notifications.v1.IdentityVerificationReviewStarted.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.TransactionOccurred.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.TransactionOccurred} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.TransactionOccurred.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    type: jspb.Message.getFieldWithDefault(msg, 2, 0),
    settlementAmount: (f = msg.getSettlementAmount()) && proto.services.notifications.v1.Money.toObject(includeInstance, f),
    displayAmount: (f = msg.getDisplayAmount()) && proto.services.notifications.v1.Money.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.TransactionOccurred}
 */
proto.services.notifications.v1.TransactionOccurred.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.TransactionOccurred;
  return proto.services.notifications.v1.TransactionOccurred.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.TransactionOccurred} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.TransactionOccurred}
 */
proto.services.notifications.v1.TransactionOccurred.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.TransactionType} */ (reader.readEnum());
      msg.setType(value);
      break;
    case 3:
      var value = new proto.services.notifications.v1.Money;
      reader.readMessage(value,proto.services.notifications.v1.Money.deserializeBinaryFromReader);
      msg.setSettlementAmount(value);
      break;
    case 4:
      var value = new proto.services.notifications.v1.Money;
      reader.readMessage(value,proto.services.notifications.v1.Money.deserializeBinaryFromReader);
      msg.setDisplayAmount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.TransactionOccurred.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.TransactionOccurred} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.TransactionOccurred.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getSettlementAmount();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.notifications.v1.Money.serializeBinaryToWriter
    );
  }
  f = message.getDisplayAmount();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.services.notifications.v1.Money.serializeBinaryToWriter
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.TransactionOccurred} returns this
 */
proto.services.notifications.v1.TransactionOccurred.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional TransactionType type = 2;
 * @return {!proto.services.notifications.v1.TransactionType}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.getType = function() {
  return /** @type {!proto.services.notifications.v1.TransactionType} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.TransactionType} value
 * @return {!proto.services.notifications.v1.TransactionOccurred} returns this
 */
proto.services.notifications.v1.TransactionOccurred.prototype.setType = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional Money settlement_amount = 3;
 * @return {?proto.services.notifications.v1.Money}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.getSettlementAmount = function() {
  return /** @type{?proto.services.notifications.v1.Money} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.Money, 3));
};


/**
 * @param {?proto.services.notifications.v1.Money|undefined} value
 * @return {!proto.services.notifications.v1.TransactionOccurred} returns this
*/
proto.services.notifications.v1.TransactionOccurred.prototype.setSettlementAmount = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.TransactionOccurred} returns this
 */
proto.services.notifications.v1.TransactionOccurred.prototype.clearSettlementAmount = function() {
  return this.setSettlementAmount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.hasSettlementAmount = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Money display_amount = 4;
 * @return {?proto.services.notifications.v1.Money}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.getDisplayAmount = function() {
  return /** @type{?proto.services.notifications.v1.Money} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.Money, 4));
};


/**
 * @param {?proto.services.notifications.v1.Money|undefined} value
 * @return {!proto.services.notifications.v1.TransactionOccurred} returns this
*/
proto.services.notifications.v1.TransactionOccurred.prototype.setDisplayAmount = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.TransactionOccurred} returns this
 */
proto.services.notifications.v1.TransactionOccurred.prototype.clearDisplayAmount = function() {
  return this.setDisplayAmount(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.TransactionOccurred.prototype.hasDisplayAmount = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.Money.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.Money.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.Money} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.Money.toObject = function(includeInstance, msg) {
  var f, obj = {
    currencyCode: jspb.Message.getFieldWithDefault(msg, 1, ""),
    minorUnits: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.Money}
 */
proto.services.notifications.v1.Money.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.Money;
  return proto.services.notifications.v1.Money.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.Money} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.Money}
 */
proto.services.notifications.v1.Money.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setCurrencyCode(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setMinorUnits(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.Money.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.Money.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.Money} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.Money.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCurrencyCode();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getMinorUnits();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * optional string currency_code = 1;
 * @return {string}
 */
proto.services.notifications.v1.Money.prototype.getCurrencyCode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.Money} returns this
 */
proto.services.notifications.v1.Money.prototype.setCurrencyCode = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 minor_units = 2;
 * @return {number}
 */
proto.services.notifications.v1.Money.prototype.getMinorUnits = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.notifications.v1.Money} returns this
 */
proto.services.notifications.v1.Money.prototype.setMinorUnits = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.PriceChanged.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.PriceChanged.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.PriceChanged} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.PriceChanged.toObject = function(includeInstance, msg) {
  var f, obj = {
    priceOfOneBitcoin: (f = msg.getPriceOfOneBitcoin()) && proto.services.notifications.v1.Money.toObject(includeInstance, f),
    direction: jspb.Message.getFieldWithDefault(msg, 2, 0),
    priceChangePercentage: jspb.Message.getFloatingPointFieldWithDefault(msg, 3, 0.0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.PriceChanged}
 */
proto.services.notifications.v1.PriceChanged.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.PriceChanged;
  return proto.services.notifications.v1.PriceChanged.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.PriceChanged} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.PriceChanged}
 */
proto.services.notifications.v1.PriceChanged.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.Money;
      reader.readMessage(value,proto.services.notifications.v1.Money.deserializeBinaryFromReader);
      msg.setPriceOfOneBitcoin(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.PriceChangeDirection} */ (reader.readEnum());
      msg.setDirection(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setPriceChangePercentage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.PriceChanged.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.PriceChanged.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.PriceChanged} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.PriceChanged.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPriceOfOneBitcoin();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.Money.serializeBinaryToWriter
    );
  }
  f = message.getDirection();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getPriceChangePercentage();
  if (f !== 0.0) {
    writer.writeDouble(
      3,
      f
    );
  }
};


/**
 * optional Money price_of_one_bitcoin = 1;
 * @return {?proto.services.notifications.v1.Money}
 */
proto.services.notifications.v1.PriceChanged.prototype.getPriceOfOneBitcoin = function() {
  return /** @type{?proto.services.notifications.v1.Money} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.Money, 1));
};


/**
 * @param {?proto.services.notifications.v1.Money|undefined} value
 * @return {!proto.services.notifications.v1.PriceChanged} returns this
*/
proto.services.notifications.v1.PriceChanged.prototype.setPriceOfOneBitcoin = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.PriceChanged} returns this
 */
proto.services.notifications.v1.PriceChanged.prototype.clearPriceOfOneBitcoin = function() {
  return this.setPriceOfOneBitcoin(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.PriceChanged.prototype.hasPriceOfOneBitcoin = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional PriceChangeDirection direction = 2;
 * @return {!proto.services.notifications.v1.PriceChangeDirection}
 */
proto.services.notifications.v1.PriceChanged.prototype.getDirection = function() {
  return /** @type {!proto.services.notifications.v1.PriceChangeDirection} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.PriceChangeDirection} value
 * @return {!proto.services.notifications.v1.PriceChanged} returns this
 */
proto.services.notifications.v1.PriceChanged.prototype.setDirection = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional double price_change_percentage = 3;
 * @return {number}
 */
proto.services.notifications.v1.PriceChanged.prototype.getPriceChangePercentage = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 3, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.services.notifications.v1.PriceChanged} returns this
 */
proto.services.notifications.v1.PriceChanged.prototype.setPriceChangePercentage = function(value) {
  return jspb.Message.setProto3FloatField(this, 3, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.notifications.v1.MarketingNotificationTriggered.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.MarketingNotificationTriggered.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.MarketingNotificationTriggered} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.MarketingNotificationTriggered.toObject = function(includeInstance, msg) {
  var f, obj = {
    userIdsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f,
    localizedContentMap: (f = msg.getLocalizedContentMap()) ? f.toObject(includeInstance, proto.services.notifications.v1.LocalizedContent.toObject) : [],
    shouldSendPush: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
    shouldAddToHistory: jspb.Message.getBooleanFieldWithDefault(msg, 4, false),
    shouldAddToBulletin: jspb.Message.getBooleanFieldWithDefault(msg, 5, false),
    action: (f = msg.getAction()) && proto.services.notifications.v1.Action.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.MarketingNotificationTriggered;
  return proto.services.notifications.v1.MarketingNotificationTriggered.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.MarketingNotificationTriggered} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addUserIds(value);
      break;
    case 2:
      var value = msg.getLocalizedContentMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.services.notifications.v1.LocalizedContent.deserializeBinaryFromReader, "", new proto.services.notifications.v1.LocalizedContent());
         });
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setShouldSendPush(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setShouldAddToHistory(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setShouldAddToBulletin(value);
      break;
    case 6:
      var value = new proto.services.notifications.v1.Action;
      reader.readMessage(value,proto.services.notifications.v1.Action.deserializeBinaryFromReader);
      msg.setAction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.MarketingNotificationTriggered.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.MarketingNotificationTriggered} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.MarketingNotificationTriggered.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserIdsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
  f = message.getLocalizedContentMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(2, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.services.notifications.v1.LocalizedContent.serializeBinaryToWriter);
  }
  f = message.getShouldSendPush();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getShouldAddToHistory();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
  f = message.getShouldAddToBulletin();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
  f = message.getAction();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.services.notifications.v1.Action.serializeBinaryToWriter
    );
  }
};


/**
 * repeated string user_ids = 1;
 * @return {!Array<string>}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.getUserIdsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.setUserIdsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.addUserIds = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.clearUserIdsList = function() {
  return this.setUserIdsList([]);
};


/**
 * map<string, LocalizedContent> localized_content = 2;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,!proto.services.notifications.v1.LocalizedContent>}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.getLocalizedContentMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,!proto.services.notifications.v1.LocalizedContent>} */ (
      jspb.Message.getMapField(this, 2, opt_noLazyCreate,
      proto.services.notifications.v1.LocalizedContent));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.clearLocalizedContentMap = function() {
  this.getLocalizedContentMap().clear();
  return this;
};


/**
 * optional bool should_send_push = 3;
 * @return {boolean}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.getShouldSendPush = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.setShouldSendPush = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional bool should_add_to_history = 4;
 * @return {boolean}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.getShouldAddToHistory = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.setShouldAddToHistory = function(value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};


/**
 * optional bool should_add_to_bulletin = 5;
 * @return {boolean}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.getShouldAddToBulletin = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.setShouldAddToBulletin = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};


/**
 * optional Action action = 6;
 * @return {?proto.services.notifications.v1.Action}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.getAction = function() {
  return /** @type{?proto.services.notifications.v1.Action} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.Action, 6));
};


/**
 * @param {?proto.services.notifications.v1.Action|undefined} value
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
*/
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.setAction = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.MarketingNotificationTriggered} returns this
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.clearAction = function() {
  return this.setAction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.MarketingNotificationTriggered.prototype.hasAction = function() {
  return jspb.Message.getField(this, 6) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.LocalizedContent.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.LocalizedContent.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.LocalizedContent} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.LocalizedContent.toObject = function(includeInstance, msg) {
  var f, obj = {
    title: jspb.Message.getFieldWithDefault(msg, 1, ""),
    body: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.LocalizedContent}
 */
proto.services.notifications.v1.LocalizedContent.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.LocalizedContent;
  return proto.services.notifications.v1.LocalizedContent.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.LocalizedContent} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.LocalizedContent}
 */
proto.services.notifications.v1.LocalizedContent.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTitle(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBody(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.LocalizedContent.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.LocalizedContent.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.LocalizedContent} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.LocalizedContent.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTitle();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBody();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string title = 1;
 * @return {string}
 */
proto.services.notifications.v1.LocalizedContent.prototype.getTitle = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.LocalizedContent} returns this
 */
proto.services.notifications.v1.LocalizedContent.prototype.setTitle = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string body = 2;
 * @return {string}
 */
proto.services.notifications.v1.LocalizedContent.prototype.getBody = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.LocalizedContent} returns this
 */
proto.services.notifications.v1.LocalizedContent.prototype.setBody = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.notifications.v1.Action.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.services.notifications.v1.Action.DataCase = {
  DATA_NOT_SET: 0,
  DEEP_LINK: 1,
  EXTERNAL_URL: 2
};

/**
 * @return {proto.services.notifications.v1.Action.DataCase}
 */
proto.services.notifications.v1.Action.prototype.getDataCase = function() {
  return /** @type {proto.services.notifications.v1.Action.DataCase} */(jspb.Message.computeOneofCase(this, proto.services.notifications.v1.Action.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.Action.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.Action.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.Action} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.Action.toObject = function(includeInstance, msg) {
  var f, obj = {
    deepLink: (f = msg.getDeepLink()) && proto.services.notifications.v1.DeepLink.toObject(includeInstance, f),
    externalUrl: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.Action}
 */
proto.services.notifications.v1.Action.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.Action;
  return proto.services.notifications.v1.Action.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.Action} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.Action}
 */
proto.services.notifications.v1.Action.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.notifications.v1.DeepLink;
      reader.readMessage(value,proto.services.notifications.v1.DeepLink.deserializeBinaryFromReader);
      msg.setDeepLink(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalUrl(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.Action.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.Action.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.Action} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.Action.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDeepLink();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.notifications.v1.DeepLink.serializeBinaryToWriter
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional DeepLink deep_link = 1;
 * @return {?proto.services.notifications.v1.DeepLink}
 */
proto.services.notifications.v1.Action.prototype.getDeepLink = function() {
  return /** @type{?proto.services.notifications.v1.DeepLink} */ (
    jspb.Message.getWrapperField(this, proto.services.notifications.v1.DeepLink, 1));
};


/**
 * @param {?proto.services.notifications.v1.DeepLink|undefined} value
 * @return {!proto.services.notifications.v1.Action} returns this
*/
proto.services.notifications.v1.Action.prototype.setDeepLink = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.services.notifications.v1.Action.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.notifications.v1.Action} returns this
 */
proto.services.notifications.v1.Action.prototype.clearDeepLink = function() {
  return this.setDeepLink(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.Action.prototype.hasDeepLink = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string external_url = 2;
 * @return {string}
 */
proto.services.notifications.v1.Action.prototype.getExternalUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.notifications.v1.Action} returns this
 */
proto.services.notifications.v1.Action.prototype.setExternalUrl = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.services.notifications.v1.Action.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.notifications.v1.Action} returns this
 */
proto.services.notifications.v1.Action.prototype.clearExternalUrl = function() {
  return jspb.Message.setOneofField(this, 2, proto.services.notifications.v1.Action.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.Action.prototype.hasExternalUrl = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.services.notifications.v1.DeepLink.prototype.toObject = function(opt_includeInstance) {
  return proto.services.notifications.v1.DeepLink.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.notifications.v1.DeepLink} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DeepLink.toObject = function(includeInstance, msg) {
  var f, obj = {
    screen: jspb.Message.getFieldWithDefault(msg, 1, 0),
    action: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.services.notifications.v1.DeepLink}
 */
proto.services.notifications.v1.DeepLink.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.notifications.v1.DeepLink;
  return proto.services.notifications.v1.DeepLink.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.notifications.v1.DeepLink} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.notifications.v1.DeepLink}
 */
proto.services.notifications.v1.DeepLink.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.services.notifications.v1.DeepLinkScreen} */ (reader.readEnum());
      msg.setScreen(value);
      break;
    case 2:
      var value = /** @type {!proto.services.notifications.v1.DeepLinkAction} */ (reader.readEnum());
      msg.setAction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.services.notifications.v1.DeepLink.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.notifications.v1.DeepLink.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.notifications.v1.DeepLink} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.notifications.v1.DeepLink.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {!proto.services.notifications.v1.DeepLinkScreen} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = /** @type {!proto.services.notifications.v1.DeepLinkAction} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional DeepLinkScreen screen = 1;
 * @return {!proto.services.notifications.v1.DeepLinkScreen}
 */
proto.services.notifications.v1.DeepLink.prototype.getScreen = function() {
  return /** @type {!proto.services.notifications.v1.DeepLinkScreen} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.services.notifications.v1.DeepLinkScreen} value
 * @return {!proto.services.notifications.v1.DeepLink} returns this
 */
proto.services.notifications.v1.DeepLink.prototype.setScreen = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.notifications.v1.DeepLink} returns this
 */
proto.services.notifications.v1.DeepLink.prototype.clearScreen = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.DeepLink.prototype.hasScreen = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional DeepLinkAction action = 2;
 * @return {!proto.services.notifications.v1.DeepLinkAction}
 */
proto.services.notifications.v1.DeepLink.prototype.getAction = function() {
  return /** @type {!proto.services.notifications.v1.DeepLinkAction} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.services.notifications.v1.DeepLinkAction} value
 * @return {!proto.services.notifications.v1.DeepLink} returns this
 */
proto.services.notifications.v1.DeepLink.prototype.setAction = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.notifications.v1.DeepLink} returns this
 */
proto.services.notifications.v1.DeepLink.prototype.clearAction = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.notifications.v1.DeepLink.prototype.hasAction = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * @enum {number}
 */
proto.services.notifications.v1.NotificationChannel = {
  PUSH: 0
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.NotificationCategory = {
  CIRCLES: 0,
  PAYMENTS: 1,
  ADMIN_NOTIFICATION: 3,
  MARKETING: 4,
  PRICE: 5
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.CircleType = {
  INNER: 0,
  OUTER: 1
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.CircleTimeFrame = {
  MONTH: 0,
  ALL_TIME: 1
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.DeclinedReason = {
  DOCUMENTS_NOT_CLEAR: 0,
  VERIFICATION_PHOTO_NOT_CLEAR: 1,
  DOCUMENTS_NOT_SUPPORTED: 2,
  DOCUMENTS_EXPIRED: 3,
  DOCUMENTS_DO_NOT_MATCH: 4,
  OTHER: 5
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.TransactionType = {
  INTRA_LEDGER_RECEIPT: 0,
  INTRA_LEDGER_PAYMENT: 1,
  ONCHAIN_RECEIPT: 2,
  ONCHAIN_RECEIPT_PENDING: 3,
  ONCHAIN_PAYMENT: 4,
  LIGHTNING_RECEIPT: 5,
  LIGHTNING_PAYMENT: 6
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.PriceChangeDirection = {
  UP: 0,
  DOWN: 1
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.DeepLinkScreen = {
  CIRCLES: 0,
  PRICE: 1,
  EARN: 2,
  MAP: 3,
  PEOPLE: 4,
  HOME: 5,
  RECEIVE: 6,
  CONVERT: 7,
  SCANQR: 8,
  CHAT: 9,
  SETTINGS: 10,
  SETTINGS2FA: 11,
  SETTINGSDISPLAYCURRENCY: 12,
  SETTINGSDEFAULTACCOUNT: 13,
  SETTINGSLANGUAGE: 14,
  SETTINGSTHEME: 15,
  SETTINGSSECURITY: 16,
  SETTINGSACCOUNT: 17,
  SETTINGSTXLIMITS: 18,
  SETTINGSNOTIFICATIONS: 19,
  SETTINGSEMAIL: 20
};

/**
 * @enum {number}
 */
proto.services.notifications.v1.DeepLinkAction = {
  SETLNADDRESSMODAL: 0,
  SETDEFAULTACCOUNTMODAL: 1,
  UPGRADEACCOUNTMODAL: 2
};

goog.object.extend(exports, proto.services.notifications.v1);
