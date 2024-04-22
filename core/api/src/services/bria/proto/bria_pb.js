// source: bria.proto
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

var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
goog.object.extend(proto, google_protobuf_struct_pb);
goog.exportSymbol('proto.services.bria.v1.BatchWalletSummary', null, global);
goog.exportSymbol('proto.services.bria.v1.BitcoindSignerConfig', null, global);
goog.exportSymbol('proto.services.bria.v1.BriaEvent', null, global);
goog.exportSymbol('proto.services.bria.v1.BriaEvent.PayloadCase', null, global);
goog.exportSymbol('proto.services.bria.v1.BriaWalletDestination', null, global);
goog.exportSymbol('proto.services.bria.v1.CancelPayoutRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.CancelPayoutResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.CreatePayoutQueueRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.CreatePayoutQueueResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.CreateProfileApiKeyRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.CreateProfileApiKeyResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.CreateProfileRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.CreateProfileResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.CreateWalletRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.CreateWalletResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.EstimatePayoutFeeRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.EstimatePayoutFeeRequest.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.EstimatePayoutFeeResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.EventAugmentation', null, global);
goog.exportSymbol('proto.services.bria.v1.GetAccountBalanceSummaryRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.GetAccountBalanceSummaryResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.GetAddressRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.GetAddressRequest.IdentifierCase', null, global);
goog.exportSymbol('proto.services.bria.v1.GetAddressResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.GetBatchRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.GetBatchResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.GetPayoutRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.GetPayoutRequest.IdentifierCase', null, global);
goog.exportSymbol('proto.services.bria.v1.GetPayoutResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.GetWalletBalanceSummaryRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.GetWalletBalanceSummaryResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.ImportXpubRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ImportXpubResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.KeychainConfig', null, global);
goog.exportSymbol('proto.services.bria.v1.KeychainConfig.ConfigCase', null, global);
goog.exportSymbol('proto.services.bria.v1.KeychainConfig.Descriptors', null, global);
goog.exportSymbol('proto.services.bria.v1.KeychainConfig.SortedMultisig', null, global);
goog.exportSymbol('proto.services.bria.v1.KeychainConfig.Wpkh', null, global);
goog.exportSymbol('proto.services.bria.v1.KeychainKind', null, global);
goog.exportSymbol('proto.services.bria.v1.KeychainUtxos', null, global);
goog.exportSymbol('proto.services.bria.v1.ListAddressesRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ListAddressesResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.ListPayoutQueuesRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ListPayoutQueuesResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.ListPayoutsRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ListPayoutsResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.ListProfilesRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ListProfilesResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.ListUtxosRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ListUtxosResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.ListWalletsRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ListWalletsResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.ListXpubsRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.ListXpubsResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.LndSignerConfig', null, global);
goog.exportSymbol('proto.services.bria.v1.NewAddressRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.NewAddressResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.Payout', null, global);
goog.exportSymbol('proto.services.bria.v1.Payout.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutBroadcast', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutBroadcast.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutCancelled', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutCancelled.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutCommitted', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutCommitted.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutQueue', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutQueueConfig', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutQueueConfig.TriggerCase', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutSettled', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutSettled.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutSubmitted', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutSubmitted.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutSummary', null, global);
goog.exportSymbol('proto.services.bria.v1.PayoutSummary.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.Profile', null, global);
goog.exportSymbol('proto.services.bria.v1.SetSignerConfigRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.SetSignerConfigRequest.ConfigCase', null, global);
goog.exportSymbol('proto.services.bria.v1.SetSignerConfigResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.SigningSession', null, global);
goog.exportSymbol('proto.services.bria.v1.SpendingPolicy', null, global);
goog.exportSymbol('proto.services.bria.v1.SubmitPayoutRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.SubmitPayoutRequest.DestinationCase', null, global);
goog.exportSymbol('proto.services.bria.v1.SubmitPayoutResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.SubmitSignedPsbtRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.SubmitSignedPsbtResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.SubscribeAllRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.TriggerPayoutQueueRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.TriggerPayoutQueueResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.TxPriority', null, global);
goog.exportSymbol('proto.services.bria.v1.UpdateAddressRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.UpdateAddressResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.UpdatePayoutQueueRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.UpdatePayoutQueueResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.UpdateProfileRequest', null, global);
goog.exportSymbol('proto.services.bria.v1.UpdateProfileResponse', null, global);
goog.exportSymbol('proto.services.bria.v1.Utxo', null, global);
goog.exportSymbol('proto.services.bria.v1.UtxoDetected', null, global);
goog.exportSymbol('proto.services.bria.v1.UtxoDropped', null, global);
goog.exportSymbol('proto.services.bria.v1.UtxoSettled', null, global);
goog.exportSymbol('proto.services.bria.v1.Wallet', null, global);
goog.exportSymbol('proto.services.bria.v1.WalletAddress', null, global);
goog.exportSymbol('proto.services.bria.v1.WalletConfig', null, global);
goog.exportSymbol('proto.services.bria.v1.Xpub', null, global);
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
proto.services.bria.v1.CreateProfileRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CreateProfileRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreateProfileRequest.displayName = 'proto.services.bria.v1.CreateProfileRequest';
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
proto.services.bria.v1.SpendingPolicy = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.SpendingPolicy.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.SpendingPolicy, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SpendingPolicy.displayName = 'proto.services.bria.v1.SpendingPolicy';
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
proto.services.bria.v1.CreateProfileResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CreateProfileResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreateProfileResponse.displayName = 'proto.services.bria.v1.CreateProfileResponse';
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
proto.services.bria.v1.UpdateProfileRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UpdateProfileRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UpdateProfileRequest.displayName = 'proto.services.bria.v1.UpdateProfileRequest';
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
proto.services.bria.v1.UpdateProfileResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UpdateProfileResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UpdateProfileResponse.displayName = 'proto.services.bria.v1.UpdateProfileResponse';
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
proto.services.bria.v1.CreateProfileApiKeyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CreateProfileApiKeyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreateProfileApiKeyRequest.displayName = 'proto.services.bria.v1.CreateProfileApiKeyRequest';
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
proto.services.bria.v1.CreateProfileApiKeyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CreateProfileApiKeyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreateProfileApiKeyResponse.displayName = 'proto.services.bria.v1.CreateProfileApiKeyResponse';
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
proto.services.bria.v1.ListProfilesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ListProfilesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListProfilesRequest.displayName = 'proto.services.bria.v1.ListProfilesRequest';
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
proto.services.bria.v1.Profile = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.Profile, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.Profile.displayName = 'proto.services.bria.v1.Profile';
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
proto.services.bria.v1.ListProfilesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.ListProfilesResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.ListProfilesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListProfilesResponse.displayName = 'proto.services.bria.v1.ListProfilesResponse';
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
proto.services.bria.v1.ImportXpubRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ImportXpubRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ImportXpubRequest.displayName = 'proto.services.bria.v1.ImportXpubRequest';
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
proto.services.bria.v1.ImportXpubResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ImportXpubResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ImportXpubResponse.displayName = 'proto.services.bria.v1.ImportXpubResponse';
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
proto.services.bria.v1.SetSignerConfigRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.SetSignerConfigRequest.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.SetSignerConfigRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SetSignerConfigRequest.displayName = 'proto.services.bria.v1.SetSignerConfigRequest';
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
proto.services.bria.v1.LndSignerConfig = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.LndSignerConfig, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.LndSignerConfig.displayName = 'proto.services.bria.v1.LndSignerConfig';
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
proto.services.bria.v1.BitcoindSignerConfig = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.BitcoindSignerConfig, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.BitcoindSignerConfig.displayName = 'proto.services.bria.v1.BitcoindSignerConfig';
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
proto.services.bria.v1.SetSignerConfigResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.SetSignerConfigResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SetSignerConfigResponse.displayName = 'proto.services.bria.v1.SetSignerConfigResponse';
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
proto.services.bria.v1.SubmitSignedPsbtRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.SubmitSignedPsbtRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SubmitSignedPsbtRequest.displayName = 'proto.services.bria.v1.SubmitSignedPsbtRequest';
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
proto.services.bria.v1.SubmitSignedPsbtResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.SubmitSignedPsbtResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SubmitSignedPsbtResponse.displayName = 'proto.services.bria.v1.SubmitSignedPsbtResponse';
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
proto.services.bria.v1.KeychainConfig = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.KeychainConfig.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.KeychainConfig, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.KeychainConfig.displayName = 'proto.services.bria.v1.KeychainConfig';
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
proto.services.bria.v1.KeychainConfig.Wpkh = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.KeychainConfig.Wpkh, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.KeychainConfig.Wpkh.displayName = 'proto.services.bria.v1.KeychainConfig.Wpkh';
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
proto.services.bria.v1.KeychainConfig.Descriptors = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.KeychainConfig.Descriptors, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.KeychainConfig.Descriptors.displayName = 'proto.services.bria.v1.KeychainConfig.Descriptors';
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
proto.services.bria.v1.KeychainConfig.SortedMultisig = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.KeychainConfig.SortedMultisig.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.KeychainConfig.SortedMultisig, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.KeychainConfig.SortedMultisig.displayName = 'proto.services.bria.v1.KeychainConfig.SortedMultisig';
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
proto.services.bria.v1.CreateWalletRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CreateWalletRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreateWalletRequest.displayName = 'proto.services.bria.v1.CreateWalletRequest';
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
proto.services.bria.v1.CreateWalletResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.CreateWalletResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.CreateWalletResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreateWalletResponse.displayName = 'proto.services.bria.v1.CreateWalletResponse';
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
proto.services.bria.v1.ListWalletsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ListWalletsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListWalletsRequest.displayName = 'proto.services.bria.v1.ListWalletsRequest';
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
proto.services.bria.v1.ListWalletsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.ListWalletsResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.ListWalletsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListWalletsResponse.displayName = 'proto.services.bria.v1.ListWalletsResponse';
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
proto.services.bria.v1.Wallet = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.Wallet, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.Wallet.displayName = 'proto.services.bria.v1.Wallet';
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
proto.services.bria.v1.WalletConfig = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.WalletConfig, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.WalletConfig.displayName = 'proto.services.bria.v1.WalletConfig';
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
proto.services.bria.v1.NewAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.NewAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.NewAddressRequest.displayName = 'proto.services.bria.v1.NewAddressRequest';
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
proto.services.bria.v1.NewAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.NewAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.NewAddressResponse.displayName = 'proto.services.bria.v1.NewAddressResponse';
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
proto.services.bria.v1.UpdateAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UpdateAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UpdateAddressRequest.displayName = 'proto.services.bria.v1.UpdateAddressRequest';
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
proto.services.bria.v1.UpdateAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UpdateAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UpdateAddressResponse.displayName = 'proto.services.bria.v1.UpdateAddressResponse';
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
proto.services.bria.v1.ListAddressesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ListAddressesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListAddressesRequest.displayName = 'proto.services.bria.v1.ListAddressesRequest';
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
proto.services.bria.v1.ListAddressesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.ListAddressesResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.ListAddressesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListAddressesResponse.displayName = 'proto.services.bria.v1.ListAddressesResponse';
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
proto.services.bria.v1.WalletAddress = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.WalletAddress, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.WalletAddress.displayName = 'proto.services.bria.v1.WalletAddress';
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
proto.services.bria.v1.GetAddressRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.GetAddressRequest.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.GetAddressRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetAddressRequest.displayName = 'proto.services.bria.v1.GetAddressRequest';
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
proto.services.bria.v1.GetAddressResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.GetAddressResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetAddressResponse.displayName = 'proto.services.bria.v1.GetAddressResponse';
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
proto.services.bria.v1.ListUtxosRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ListUtxosRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListUtxosRequest.displayName = 'proto.services.bria.v1.ListUtxosRequest';
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
proto.services.bria.v1.Utxo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.Utxo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.Utxo.displayName = 'proto.services.bria.v1.Utxo';
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
proto.services.bria.v1.KeychainUtxos = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.KeychainUtxos.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.KeychainUtxos, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.KeychainUtxos.displayName = 'proto.services.bria.v1.KeychainUtxos';
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
proto.services.bria.v1.ListUtxosResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.ListUtxosResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.ListUtxosResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListUtxosResponse.displayName = 'proto.services.bria.v1.ListUtxosResponse';
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
proto.services.bria.v1.GetWalletBalanceSummaryRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.GetWalletBalanceSummaryRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetWalletBalanceSummaryRequest.displayName = 'proto.services.bria.v1.GetWalletBalanceSummaryRequest';
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
proto.services.bria.v1.GetWalletBalanceSummaryResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.GetWalletBalanceSummaryResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetWalletBalanceSummaryResponse.displayName = 'proto.services.bria.v1.GetWalletBalanceSummaryResponse';
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
proto.services.bria.v1.GetAccountBalanceSummaryRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.GetAccountBalanceSummaryRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetAccountBalanceSummaryRequest.displayName = 'proto.services.bria.v1.GetAccountBalanceSummaryRequest';
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
proto.services.bria.v1.GetAccountBalanceSummaryResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.GetAccountBalanceSummaryResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetAccountBalanceSummaryResponse.displayName = 'proto.services.bria.v1.GetAccountBalanceSummaryResponse';
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
proto.services.bria.v1.CreatePayoutQueueRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CreatePayoutQueueRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreatePayoutQueueRequest.displayName = 'proto.services.bria.v1.CreatePayoutQueueRequest';
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
proto.services.bria.v1.PayoutQueueConfig = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.PayoutQueueConfig.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.PayoutQueueConfig, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutQueueConfig.displayName = 'proto.services.bria.v1.PayoutQueueConfig';
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
proto.services.bria.v1.CreatePayoutQueueResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CreatePayoutQueueResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CreatePayoutQueueResponse.displayName = 'proto.services.bria.v1.CreatePayoutQueueResponse';
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
proto.services.bria.v1.TriggerPayoutQueueRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.TriggerPayoutQueueRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.TriggerPayoutQueueRequest.displayName = 'proto.services.bria.v1.TriggerPayoutQueueRequest';
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
proto.services.bria.v1.TriggerPayoutQueueResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.TriggerPayoutQueueResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.TriggerPayoutQueueResponse.displayName = 'proto.services.bria.v1.TriggerPayoutQueueResponse';
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
proto.services.bria.v1.PayoutQueue = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.PayoutQueue, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutQueue.displayName = 'proto.services.bria.v1.PayoutQueue';
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
proto.services.bria.v1.ListPayoutQueuesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.ListPayoutQueuesResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.ListPayoutQueuesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListPayoutQueuesResponse.displayName = 'proto.services.bria.v1.ListPayoutQueuesResponse';
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
proto.services.bria.v1.ListPayoutQueuesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ListPayoutQueuesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListPayoutQueuesRequest.displayName = 'proto.services.bria.v1.ListPayoutQueuesRequest';
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
proto.services.bria.v1.UpdatePayoutQueueRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UpdatePayoutQueueRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UpdatePayoutQueueRequest.displayName = 'proto.services.bria.v1.UpdatePayoutQueueRequest';
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
proto.services.bria.v1.UpdatePayoutQueueResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UpdatePayoutQueueResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UpdatePayoutQueueResponse.displayName = 'proto.services.bria.v1.UpdatePayoutQueueResponse';
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
proto.services.bria.v1.EstimatePayoutFeeRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.EstimatePayoutFeeRequest.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.EstimatePayoutFeeRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.EstimatePayoutFeeRequest.displayName = 'proto.services.bria.v1.EstimatePayoutFeeRequest';
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
proto.services.bria.v1.EstimatePayoutFeeResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.EstimatePayoutFeeResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.EstimatePayoutFeeResponse.displayName = 'proto.services.bria.v1.EstimatePayoutFeeResponse';
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
proto.services.bria.v1.SubmitPayoutRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.SubmitPayoutRequest.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.SubmitPayoutRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SubmitPayoutRequest.displayName = 'proto.services.bria.v1.SubmitPayoutRequest';
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
proto.services.bria.v1.SubmitPayoutResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.SubmitPayoutResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SubmitPayoutResponse.displayName = 'proto.services.bria.v1.SubmitPayoutResponse';
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
proto.services.bria.v1.ListPayoutsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ListPayoutsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListPayoutsRequest.displayName = 'proto.services.bria.v1.ListPayoutsRequest';
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
proto.services.bria.v1.BriaWalletDestination = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.BriaWalletDestination, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.BriaWalletDestination.displayName = 'proto.services.bria.v1.BriaWalletDestination';
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
proto.services.bria.v1.Payout = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.Payout.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.Payout, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.Payout.displayName = 'proto.services.bria.v1.Payout';
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
proto.services.bria.v1.ListPayoutsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.ListPayoutsResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.ListPayoutsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListPayoutsResponse.displayName = 'proto.services.bria.v1.ListPayoutsResponse';
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
proto.services.bria.v1.GetPayoutRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.GetPayoutRequest.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.GetPayoutRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetPayoutRequest.displayName = 'proto.services.bria.v1.GetPayoutRequest';
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
proto.services.bria.v1.GetPayoutResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.GetPayoutResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetPayoutResponse.displayName = 'proto.services.bria.v1.GetPayoutResponse';
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
proto.services.bria.v1.CancelPayoutRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CancelPayoutRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CancelPayoutRequest.displayName = 'proto.services.bria.v1.CancelPayoutRequest';
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
proto.services.bria.v1.CancelPayoutResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.CancelPayoutResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.CancelPayoutResponse.displayName = 'proto.services.bria.v1.CancelPayoutResponse';
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
proto.services.bria.v1.GetBatchRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.GetBatchRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetBatchRequest.displayName = 'proto.services.bria.v1.GetBatchRequest';
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
proto.services.bria.v1.GetBatchResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.GetBatchResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.GetBatchResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.GetBatchResponse.displayName = 'proto.services.bria.v1.GetBatchResponse';
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
proto.services.bria.v1.BatchWalletSummary = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.BatchWalletSummary.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.BatchWalletSummary, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.BatchWalletSummary.displayName = 'proto.services.bria.v1.BatchWalletSummary';
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
proto.services.bria.v1.PayoutSummary = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.PayoutSummary.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.PayoutSummary, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutSummary.displayName = 'proto.services.bria.v1.PayoutSummary';
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
proto.services.bria.v1.SigningSession = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.SigningSession, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SigningSession.displayName = 'proto.services.bria.v1.SigningSession';
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
proto.services.bria.v1.ListXpubsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.ListXpubsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListXpubsRequest.displayName = 'proto.services.bria.v1.ListXpubsRequest';
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
proto.services.bria.v1.ListXpubsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.services.bria.v1.ListXpubsResponse.repeatedFields_, null);
};
goog.inherits(proto.services.bria.v1.ListXpubsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.ListXpubsResponse.displayName = 'proto.services.bria.v1.ListXpubsResponse';
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
proto.services.bria.v1.Xpub = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.Xpub, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.Xpub.displayName = 'proto.services.bria.v1.Xpub';
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
proto.services.bria.v1.SubscribeAllRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.SubscribeAllRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.SubscribeAllRequest.displayName = 'proto.services.bria.v1.SubscribeAllRequest';
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
proto.services.bria.v1.BriaEvent = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.BriaEvent.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.BriaEvent, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.BriaEvent.displayName = 'proto.services.bria.v1.BriaEvent';
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
proto.services.bria.v1.EventAugmentation = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.EventAugmentation, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.EventAugmentation.displayName = 'proto.services.bria.v1.EventAugmentation';
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
proto.services.bria.v1.UtxoDetected = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UtxoDetected, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UtxoDetected.displayName = 'proto.services.bria.v1.UtxoDetected';
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
proto.services.bria.v1.UtxoSettled = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UtxoSettled, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UtxoSettled.displayName = 'proto.services.bria.v1.UtxoSettled';
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
proto.services.bria.v1.UtxoDropped = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.services.bria.v1.UtxoDropped, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.UtxoDropped.displayName = 'proto.services.bria.v1.UtxoDropped';
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
proto.services.bria.v1.PayoutSubmitted = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.PayoutSubmitted.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.PayoutSubmitted, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutSubmitted.displayName = 'proto.services.bria.v1.PayoutSubmitted';
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
proto.services.bria.v1.PayoutCancelled = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.PayoutCancelled.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.PayoutCancelled, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutCancelled.displayName = 'proto.services.bria.v1.PayoutCancelled';
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
proto.services.bria.v1.PayoutCommitted = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.PayoutCommitted.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.PayoutCommitted, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutCommitted.displayName = 'proto.services.bria.v1.PayoutCommitted';
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
proto.services.bria.v1.PayoutBroadcast = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.PayoutBroadcast.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.PayoutBroadcast, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutBroadcast.displayName = 'proto.services.bria.v1.PayoutBroadcast';
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
proto.services.bria.v1.PayoutSettled = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.services.bria.v1.PayoutSettled.oneofGroups_);
};
goog.inherits(proto.services.bria.v1.PayoutSettled, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.services.bria.v1.PayoutSettled.displayName = 'proto.services.bria.v1.PayoutSettled';
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
proto.services.bria.v1.CreateProfileRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreateProfileRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreateProfileRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    spendingPolicy: (f = msg.getSpendingPolicy()) && proto.services.bria.v1.SpendingPolicy.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.CreateProfileRequest}
 */
proto.services.bria.v1.CreateProfileRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreateProfileRequest;
  return proto.services.bria.v1.CreateProfileRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreateProfileRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreateProfileRequest}
 */
proto.services.bria.v1.CreateProfileRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.SpendingPolicy;
      reader.readMessage(value,proto.services.bria.v1.SpendingPolicy.deserializeBinaryFromReader);
      msg.setSpendingPolicy(value);
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
proto.services.bria.v1.CreateProfileRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreateProfileRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreateProfileRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getSpendingPolicy();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.services.bria.v1.SpendingPolicy.serializeBinaryToWriter
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.services.bria.v1.CreateProfileRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreateProfileRequest} returns this
 */
proto.services.bria.v1.CreateProfileRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional SpendingPolicy spending_policy = 2;
 * @return {?proto.services.bria.v1.SpendingPolicy}
 */
proto.services.bria.v1.CreateProfileRequest.prototype.getSpendingPolicy = function() {
  return /** @type{?proto.services.bria.v1.SpendingPolicy} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.SpendingPolicy, 2));
};


/**
 * @param {?proto.services.bria.v1.SpendingPolicy|undefined} value
 * @return {!proto.services.bria.v1.CreateProfileRequest} returns this
*/
proto.services.bria.v1.CreateProfileRequest.prototype.setSpendingPolicy = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.CreateProfileRequest} returns this
 */
proto.services.bria.v1.CreateProfileRequest.prototype.clearSpendingPolicy = function() {
  return this.setSpendingPolicy(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.CreateProfileRequest.prototype.hasSpendingPolicy = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.SpendingPolicy.repeatedFields_ = [1];



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
proto.services.bria.v1.SpendingPolicy.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SpendingPolicy.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SpendingPolicy} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SpendingPolicy.toObject = function(includeInstance, msg) {
  var f, obj = {
    allowedPayoutAddressesList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f,
    maxPayoutSats: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.services.bria.v1.SpendingPolicy}
 */
proto.services.bria.v1.SpendingPolicy.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SpendingPolicy;
  return proto.services.bria.v1.SpendingPolicy.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SpendingPolicy} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SpendingPolicy}
 */
proto.services.bria.v1.SpendingPolicy.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addAllowedPayoutAddresses(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setMaxPayoutSats(value);
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
proto.services.bria.v1.SpendingPolicy.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SpendingPolicy.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SpendingPolicy} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SpendingPolicy.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAllowedPayoutAddressesList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeUint64(
      2,
      f
    );
  }
};


/**
 * repeated string allowed_payout_addresses = 1;
 * @return {!Array<string>}
 */
proto.services.bria.v1.SpendingPolicy.prototype.getAllowedPayoutAddressesList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.services.bria.v1.SpendingPolicy} returns this
 */
proto.services.bria.v1.SpendingPolicy.prototype.setAllowedPayoutAddressesList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.SpendingPolicy} returns this
 */
proto.services.bria.v1.SpendingPolicy.prototype.addAllowedPayoutAddresses = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.SpendingPolicy} returns this
 */
proto.services.bria.v1.SpendingPolicy.prototype.clearAllowedPayoutAddressesList = function() {
  return this.setAllowedPayoutAddressesList([]);
};


/**
 * optional uint64 max_payout_sats = 2;
 * @return {number}
 */
proto.services.bria.v1.SpendingPolicy.prototype.getMaxPayoutSats = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.SpendingPolicy} returns this
 */
proto.services.bria.v1.SpendingPolicy.prototype.setMaxPayoutSats = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SpendingPolicy} returns this
 */
proto.services.bria.v1.SpendingPolicy.prototype.clearMaxPayoutSats = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SpendingPolicy.prototype.hasMaxPayoutSats = function() {
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
proto.services.bria.v1.CreateProfileResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreateProfileResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreateProfileResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.CreateProfileResponse}
 */
proto.services.bria.v1.CreateProfileResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreateProfileResponse;
  return proto.services.bria.v1.CreateProfileResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreateProfileResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreateProfileResponse}
 */
proto.services.bria.v1.CreateProfileResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
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
proto.services.bria.v1.CreateProfileResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreateProfileResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreateProfileResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.CreateProfileResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreateProfileResponse} returns this
 */
proto.services.bria.v1.CreateProfileResponse.prototype.setId = function(value) {
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
proto.services.bria.v1.UpdateProfileRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UpdateProfileRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UpdateProfileRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateProfileRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    spendingPolicy: (f = msg.getSpendingPolicy()) && proto.services.bria.v1.SpendingPolicy.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.UpdateProfileRequest}
 */
proto.services.bria.v1.UpdateProfileRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UpdateProfileRequest;
  return proto.services.bria.v1.UpdateProfileRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UpdateProfileRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UpdateProfileRequest}
 */
proto.services.bria.v1.UpdateProfileRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.SpendingPolicy;
      reader.readMessage(value,proto.services.bria.v1.SpendingPolicy.deserializeBinaryFromReader);
      msg.setSpendingPolicy(value);
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
proto.services.bria.v1.UpdateProfileRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UpdateProfileRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UpdateProfileRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateProfileRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getSpendingPolicy();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.services.bria.v1.SpendingPolicy.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.UpdateProfileRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UpdateProfileRequest} returns this
 */
proto.services.bria.v1.UpdateProfileRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional SpendingPolicy spending_policy = 2;
 * @return {?proto.services.bria.v1.SpendingPolicy}
 */
proto.services.bria.v1.UpdateProfileRequest.prototype.getSpendingPolicy = function() {
  return /** @type{?proto.services.bria.v1.SpendingPolicy} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.SpendingPolicy, 2));
};


/**
 * @param {?proto.services.bria.v1.SpendingPolicy|undefined} value
 * @return {!proto.services.bria.v1.UpdateProfileRequest} returns this
*/
proto.services.bria.v1.UpdateProfileRequest.prototype.setSpendingPolicy = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.UpdateProfileRequest} returns this
 */
proto.services.bria.v1.UpdateProfileRequest.prototype.clearSpendingPolicy = function() {
  return this.setSpendingPolicy(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.UpdateProfileRequest.prototype.hasSpendingPolicy = function() {
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
proto.services.bria.v1.UpdateProfileResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UpdateProfileResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UpdateProfileResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateProfileResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.UpdateProfileResponse}
 */
proto.services.bria.v1.UpdateProfileResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UpdateProfileResponse;
  return proto.services.bria.v1.UpdateProfileResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UpdateProfileResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UpdateProfileResponse}
 */
proto.services.bria.v1.UpdateProfileResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.UpdateProfileResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UpdateProfileResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UpdateProfileResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateProfileResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.CreateProfileApiKeyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreateProfileApiKeyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreateProfileApiKeyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileApiKeyRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    profileName: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.CreateProfileApiKeyRequest}
 */
proto.services.bria.v1.CreateProfileApiKeyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreateProfileApiKeyRequest;
  return proto.services.bria.v1.CreateProfileApiKeyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreateProfileApiKeyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreateProfileApiKeyRequest}
 */
proto.services.bria.v1.CreateProfileApiKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setProfileName(value);
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
proto.services.bria.v1.CreateProfileApiKeyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreateProfileApiKeyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreateProfileApiKeyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileApiKeyRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProfileName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string profile_name = 1;
 * @return {string}
 */
proto.services.bria.v1.CreateProfileApiKeyRequest.prototype.getProfileName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreateProfileApiKeyRequest} returns this
 */
proto.services.bria.v1.CreateProfileApiKeyRequest.prototype.setProfileName = function(value) {
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
proto.services.bria.v1.CreateProfileApiKeyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreateProfileApiKeyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreateProfileApiKeyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    key: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.services.bria.v1.CreateProfileApiKeyResponse}
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreateProfileApiKeyResponse;
  return proto.services.bria.v1.CreateProfileApiKeyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreateProfileApiKeyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreateProfileApiKeyResponse}
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setKey(value);
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
proto.services.bria.v1.CreateProfileApiKeyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreateProfileApiKeyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreateProfileApiKeyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreateProfileApiKeyResponse} returns this
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string key = 2;
 * @return {string}
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreateProfileApiKeyResponse} returns this
 */
proto.services.bria.v1.CreateProfileApiKeyResponse.prototype.setKey = function(value) {
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
proto.services.bria.v1.ListProfilesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListProfilesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListProfilesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListProfilesRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.ListProfilesRequest}
 */
proto.services.bria.v1.ListProfilesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListProfilesRequest;
  return proto.services.bria.v1.ListProfilesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListProfilesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListProfilesRequest}
 */
proto.services.bria.v1.ListProfilesRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.ListProfilesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListProfilesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListProfilesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListProfilesRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.Profile.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.Profile.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.Profile} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Profile.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    name: jspb.Message.getFieldWithDefault(msg, 2, ""),
    spendingPolicy: (f = msg.getSpendingPolicy()) && proto.services.bria.v1.SpendingPolicy.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.Profile}
 */
proto.services.bria.v1.Profile.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.Profile;
  return proto.services.bria.v1.Profile.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.Profile} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.Profile}
 */
proto.services.bria.v1.Profile.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 3:
      var value = new proto.services.bria.v1.SpendingPolicy;
      reader.readMessage(value,proto.services.bria.v1.SpendingPolicy.deserializeBinaryFromReader);
      msg.setSpendingPolicy(value);
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
proto.services.bria.v1.Profile.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.Profile.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.Profile} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Profile.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getSpendingPolicy();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.bria.v1.SpendingPolicy.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.Profile.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Profile} returns this
 */
proto.services.bria.v1.Profile.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.services.bria.v1.Profile.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Profile} returns this
 */
proto.services.bria.v1.Profile.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional SpendingPolicy spending_policy = 3;
 * @return {?proto.services.bria.v1.SpendingPolicy}
 */
proto.services.bria.v1.Profile.prototype.getSpendingPolicy = function() {
  return /** @type{?proto.services.bria.v1.SpendingPolicy} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.SpendingPolicy, 3));
};


/**
 * @param {?proto.services.bria.v1.SpendingPolicy|undefined} value
 * @return {!proto.services.bria.v1.Profile} returns this
*/
proto.services.bria.v1.Profile.prototype.setSpendingPolicy = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.Profile} returns this
 */
proto.services.bria.v1.Profile.prototype.clearSpendingPolicy = function() {
  return this.setSpendingPolicy(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Profile.prototype.hasSpendingPolicy = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.ListProfilesResponse.repeatedFields_ = [1];



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
proto.services.bria.v1.ListProfilesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListProfilesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListProfilesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListProfilesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    profilesList: jspb.Message.toObjectList(msg.getProfilesList(),
    proto.services.bria.v1.Profile.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.ListProfilesResponse}
 */
proto.services.bria.v1.ListProfilesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListProfilesResponse;
  return proto.services.bria.v1.ListProfilesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListProfilesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListProfilesResponse}
 */
proto.services.bria.v1.ListProfilesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.Profile;
      reader.readMessage(value,proto.services.bria.v1.Profile.deserializeBinaryFromReader);
      msg.addProfiles(value);
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
proto.services.bria.v1.ListProfilesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListProfilesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListProfilesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListProfilesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProfilesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.services.bria.v1.Profile.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Profile profiles = 1;
 * @return {!Array<!proto.services.bria.v1.Profile>}
 */
proto.services.bria.v1.ListProfilesResponse.prototype.getProfilesList = function() {
  return /** @type{!Array<!proto.services.bria.v1.Profile>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.Profile, 1));
};


/**
 * @param {!Array<!proto.services.bria.v1.Profile>} value
 * @return {!proto.services.bria.v1.ListProfilesResponse} returns this
*/
proto.services.bria.v1.ListProfilesResponse.prototype.setProfilesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.services.bria.v1.Profile=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.Profile}
 */
proto.services.bria.v1.ListProfilesResponse.prototype.addProfiles = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.services.bria.v1.Profile, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.ListProfilesResponse} returns this
 */
proto.services.bria.v1.ListProfilesResponse.prototype.clearProfilesList = function() {
  return this.setProfilesList([]);
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
proto.services.bria.v1.ImportXpubRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ImportXpubRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ImportXpubRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ImportXpubRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    xpub: jspb.Message.getFieldWithDefault(msg, 2, ""),
    derivation: jspb.Message.getFieldWithDefault(msg, 3, "")
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
 * @return {!proto.services.bria.v1.ImportXpubRequest}
 */
proto.services.bria.v1.ImportXpubRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ImportXpubRequest;
  return proto.services.bria.v1.ImportXpubRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ImportXpubRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ImportXpubRequest}
 */
proto.services.bria.v1.ImportXpubRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setXpub(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDerivation(value);
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
proto.services.bria.v1.ImportXpubRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ImportXpubRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ImportXpubRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ImportXpubRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getXpub();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getDerivation();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.services.bria.v1.ImportXpubRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ImportXpubRequest} returns this
 */
proto.services.bria.v1.ImportXpubRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string xpub = 2;
 * @return {string}
 */
proto.services.bria.v1.ImportXpubRequest.prototype.getXpub = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ImportXpubRequest} returns this
 */
proto.services.bria.v1.ImportXpubRequest.prototype.setXpub = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string derivation = 3;
 * @return {string}
 */
proto.services.bria.v1.ImportXpubRequest.prototype.getDerivation = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ImportXpubRequest} returns this
 */
proto.services.bria.v1.ImportXpubRequest.prototype.setDerivation = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
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
proto.services.bria.v1.ImportXpubResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ImportXpubResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ImportXpubResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ImportXpubResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.ImportXpubResponse}
 */
proto.services.bria.v1.ImportXpubResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ImportXpubResponse;
  return proto.services.bria.v1.ImportXpubResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ImportXpubResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ImportXpubResponse}
 */
proto.services.bria.v1.ImportXpubResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
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
proto.services.bria.v1.ImportXpubResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ImportXpubResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ImportXpubResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ImportXpubResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.ImportXpubResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ImportXpubResponse} returns this
 */
proto.services.bria.v1.ImportXpubResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.SetSignerConfigRequest.oneofGroups_ = [[2,3]];

/**
 * @enum {number}
 */
proto.services.bria.v1.SetSignerConfigRequest.ConfigCase = {
  CONFIG_NOT_SET: 0,
  LND: 2,
  BITCOIND: 3
};

/**
 * @return {proto.services.bria.v1.SetSignerConfigRequest.ConfigCase}
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.getConfigCase = function() {
  return /** @type {proto.services.bria.v1.SetSignerConfigRequest.ConfigCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.SetSignerConfigRequest.oneofGroups_[0]));
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
proto.services.bria.v1.SetSignerConfigRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SetSignerConfigRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SetSignerConfigRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SetSignerConfigRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    xpubRef: jspb.Message.getFieldWithDefault(msg, 1, ""),
    lnd: (f = msg.getLnd()) && proto.services.bria.v1.LndSignerConfig.toObject(includeInstance, f),
    bitcoind: (f = msg.getBitcoind()) && proto.services.bria.v1.BitcoindSignerConfig.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.SetSignerConfigRequest}
 */
proto.services.bria.v1.SetSignerConfigRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SetSignerConfigRequest;
  return proto.services.bria.v1.SetSignerConfigRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SetSignerConfigRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SetSignerConfigRequest}
 */
proto.services.bria.v1.SetSignerConfigRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setXpubRef(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.LndSignerConfig;
      reader.readMessage(value,proto.services.bria.v1.LndSignerConfig.deserializeBinaryFromReader);
      msg.setLnd(value);
      break;
    case 3:
      var value = new proto.services.bria.v1.BitcoindSignerConfig;
      reader.readMessage(value,proto.services.bria.v1.BitcoindSignerConfig.deserializeBinaryFromReader);
      msg.setBitcoind(value);
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
proto.services.bria.v1.SetSignerConfigRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SetSignerConfigRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SetSignerConfigRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SetSignerConfigRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getXpubRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLnd();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.services.bria.v1.LndSignerConfig.serializeBinaryToWriter
    );
  }
  f = message.getBitcoind();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.bria.v1.BitcoindSignerConfig.serializeBinaryToWriter
    );
  }
};


/**
 * optional string xpub_ref = 1;
 * @return {string}
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.getXpubRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SetSignerConfigRequest} returns this
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.setXpubRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional LndSignerConfig lnd = 2;
 * @return {?proto.services.bria.v1.LndSignerConfig}
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.getLnd = function() {
  return /** @type{?proto.services.bria.v1.LndSignerConfig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.LndSignerConfig, 2));
};


/**
 * @param {?proto.services.bria.v1.LndSignerConfig|undefined} value
 * @return {!proto.services.bria.v1.SetSignerConfigRequest} returns this
*/
proto.services.bria.v1.SetSignerConfigRequest.prototype.setLnd = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.services.bria.v1.SetSignerConfigRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.SetSignerConfigRequest} returns this
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.clearLnd = function() {
  return this.setLnd(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.hasLnd = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional BitcoindSignerConfig bitcoind = 3;
 * @return {?proto.services.bria.v1.BitcoindSignerConfig}
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.getBitcoind = function() {
  return /** @type{?proto.services.bria.v1.BitcoindSignerConfig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BitcoindSignerConfig, 3));
};


/**
 * @param {?proto.services.bria.v1.BitcoindSignerConfig|undefined} value
 * @return {!proto.services.bria.v1.SetSignerConfigRequest} returns this
*/
proto.services.bria.v1.SetSignerConfigRequest.prototype.setBitcoind = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.services.bria.v1.SetSignerConfigRequest.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.SetSignerConfigRequest} returns this
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.clearBitcoind = function() {
  return this.setBitcoind(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SetSignerConfigRequest.prototype.hasBitcoind = function() {
  return jspb.Message.getField(this, 3) != null;
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
proto.services.bria.v1.LndSignerConfig.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.LndSignerConfig.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.LndSignerConfig} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.LndSignerConfig.toObject = function(includeInstance, msg) {
  var f, obj = {
    endpoint: jspb.Message.getFieldWithDefault(msg, 1, ""),
    certBase64: jspb.Message.getFieldWithDefault(msg, 2, ""),
    macaroonBase64: jspb.Message.getFieldWithDefault(msg, 3, "")
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
 * @return {!proto.services.bria.v1.LndSignerConfig}
 */
proto.services.bria.v1.LndSignerConfig.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.LndSignerConfig;
  return proto.services.bria.v1.LndSignerConfig.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.LndSignerConfig} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.LndSignerConfig}
 */
proto.services.bria.v1.LndSignerConfig.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setEndpoint(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setCertBase64(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setMacaroonBase64(value);
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
proto.services.bria.v1.LndSignerConfig.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.LndSignerConfig.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.LndSignerConfig} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.LndSignerConfig.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEndpoint();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getCertBase64();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMacaroonBase64();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string endpoint = 1;
 * @return {string}
 */
proto.services.bria.v1.LndSignerConfig.prototype.getEndpoint = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.LndSignerConfig} returns this
 */
proto.services.bria.v1.LndSignerConfig.prototype.setEndpoint = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string cert_base64 = 2;
 * @return {string}
 */
proto.services.bria.v1.LndSignerConfig.prototype.getCertBase64 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.LndSignerConfig} returns this
 */
proto.services.bria.v1.LndSignerConfig.prototype.setCertBase64 = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string macaroon_base64 = 3;
 * @return {string}
 */
proto.services.bria.v1.LndSignerConfig.prototype.getMacaroonBase64 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.LndSignerConfig} returns this
 */
proto.services.bria.v1.LndSignerConfig.prototype.setMacaroonBase64 = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
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
proto.services.bria.v1.BitcoindSignerConfig.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.BitcoindSignerConfig.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.BitcoindSignerConfig} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BitcoindSignerConfig.toObject = function(includeInstance, msg) {
  var f, obj = {
    endpoint: jspb.Message.getFieldWithDefault(msg, 1, ""),
    rpcUser: jspb.Message.getFieldWithDefault(msg, 2, ""),
    rpcPassword: jspb.Message.getFieldWithDefault(msg, 3, "")
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
 * @return {!proto.services.bria.v1.BitcoindSignerConfig}
 */
proto.services.bria.v1.BitcoindSignerConfig.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.BitcoindSignerConfig;
  return proto.services.bria.v1.BitcoindSignerConfig.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.BitcoindSignerConfig} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.BitcoindSignerConfig}
 */
proto.services.bria.v1.BitcoindSignerConfig.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setEndpoint(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setRpcUser(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setRpcPassword(value);
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
proto.services.bria.v1.BitcoindSignerConfig.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.BitcoindSignerConfig.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.BitcoindSignerConfig} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BitcoindSignerConfig.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEndpoint();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRpcUser();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getRpcPassword();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string endpoint = 1;
 * @return {string}
 */
proto.services.bria.v1.BitcoindSignerConfig.prototype.getEndpoint = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.BitcoindSignerConfig} returns this
 */
proto.services.bria.v1.BitcoindSignerConfig.prototype.setEndpoint = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string rpc_user = 2;
 * @return {string}
 */
proto.services.bria.v1.BitcoindSignerConfig.prototype.getRpcUser = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.BitcoindSignerConfig} returns this
 */
proto.services.bria.v1.BitcoindSignerConfig.prototype.setRpcUser = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string rpc_password = 3;
 * @return {string}
 */
proto.services.bria.v1.BitcoindSignerConfig.prototype.getRpcPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.BitcoindSignerConfig} returns this
 */
proto.services.bria.v1.BitcoindSignerConfig.prototype.setRpcPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
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
proto.services.bria.v1.SetSignerConfigResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SetSignerConfigResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SetSignerConfigResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SetSignerConfigResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.SetSignerConfigResponse}
 */
proto.services.bria.v1.SetSignerConfigResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SetSignerConfigResponse;
  return proto.services.bria.v1.SetSignerConfigResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SetSignerConfigResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SetSignerConfigResponse}
 */
proto.services.bria.v1.SetSignerConfigResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.SetSignerConfigResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SetSignerConfigResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SetSignerConfigResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SetSignerConfigResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SubmitSignedPsbtRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SubmitSignedPsbtRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    batchId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    xpubRef: jspb.Message.getFieldWithDefault(msg, 2, ""),
    signedPsbt: jspb.Message.getFieldWithDefault(msg, 3, "")
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
 * @return {!proto.services.bria.v1.SubmitSignedPsbtRequest}
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SubmitSignedPsbtRequest;
  return proto.services.bria.v1.SubmitSignedPsbtRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SubmitSignedPsbtRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SubmitSignedPsbtRequest}
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setBatchId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setXpubRef(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setSignedPsbt(value);
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
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SubmitSignedPsbtRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SubmitSignedPsbtRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBatchId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getXpubRef();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getSignedPsbt();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string batch_id = 1;
 * @return {string}
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.getBatchId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitSignedPsbtRequest} returns this
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.setBatchId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string xpub_ref = 2;
 * @return {string}
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.getXpubRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitSignedPsbtRequest} returns this
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.setXpubRef = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string signed_psbt = 3;
 * @return {string}
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.getSignedPsbt = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitSignedPsbtRequest} returns this
 */
proto.services.bria.v1.SubmitSignedPsbtRequest.prototype.setSignedPsbt = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
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
proto.services.bria.v1.SubmitSignedPsbtResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SubmitSignedPsbtResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SubmitSignedPsbtResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitSignedPsbtResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.SubmitSignedPsbtResponse}
 */
proto.services.bria.v1.SubmitSignedPsbtResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SubmitSignedPsbtResponse;
  return proto.services.bria.v1.SubmitSignedPsbtResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SubmitSignedPsbtResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SubmitSignedPsbtResponse}
 */
proto.services.bria.v1.SubmitSignedPsbtResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.SubmitSignedPsbtResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SubmitSignedPsbtResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SubmitSignedPsbtResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitSignedPsbtResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.KeychainConfig.oneofGroups_ = [[1,2,3]];

/**
 * @enum {number}
 */
proto.services.bria.v1.KeychainConfig.ConfigCase = {
  CONFIG_NOT_SET: 0,
  WPKH: 1,
  DESCRIPTORS: 2,
  SORTED_MULTISIG: 3
};

/**
 * @return {proto.services.bria.v1.KeychainConfig.ConfigCase}
 */
proto.services.bria.v1.KeychainConfig.prototype.getConfigCase = function() {
  return /** @type {proto.services.bria.v1.KeychainConfig.ConfigCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.KeychainConfig.oneofGroups_[0]));
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
proto.services.bria.v1.KeychainConfig.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.KeychainConfig.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.KeychainConfig} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.toObject = function(includeInstance, msg) {
  var f, obj = {
    wpkh: (f = msg.getWpkh()) && proto.services.bria.v1.KeychainConfig.Wpkh.toObject(includeInstance, f),
    descriptors: (f = msg.getDescriptors()) && proto.services.bria.v1.KeychainConfig.Descriptors.toObject(includeInstance, f),
    sortedMultisig: (f = msg.getSortedMultisig()) && proto.services.bria.v1.KeychainConfig.SortedMultisig.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.KeychainConfig}
 */
proto.services.bria.v1.KeychainConfig.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.KeychainConfig;
  return proto.services.bria.v1.KeychainConfig.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.KeychainConfig} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.KeychainConfig}
 */
proto.services.bria.v1.KeychainConfig.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.KeychainConfig.Wpkh;
      reader.readMessage(value,proto.services.bria.v1.KeychainConfig.Wpkh.deserializeBinaryFromReader);
      msg.setWpkh(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.KeychainConfig.Descriptors;
      reader.readMessage(value,proto.services.bria.v1.KeychainConfig.Descriptors.deserializeBinaryFromReader);
      msg.setDescriptors(value);
      break;
    case 3:
      var value = new proto.services.bria.v1.KeychainConfig.SortedMultisig;
      reader.readMessage(value,proto.services.bria.v1.KeychainConfig.SortedMultisig.deserializeBinaryFromReader);
      msg.setSortedMultisig(value);
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
proto.services.bria.v1.KeychainConfig.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.KeychainConfig.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.KeychainConfig} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWpkh();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.bria.v1.KeychainConfig.Wpkh.serializeBinaryToWriter
    );
  }
  f = message.getDescriptors();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.services.bria.v1.KeychainConfig.Descriptors.serializeBinaryToWriter
    );
  }
  f = message.getSortedMultisig();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.bria.v1.KeychainConfig.SortedMultisig.serializeBinaryToWriter
    );
  }
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
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.KeychainConfig.Wpkh.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.KeychainConfig.Wpkh} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.Wpkh.toObject = function(includeInstance, msg) {
  var f, obj = {
    xpub: jspb.Message.getFieldWithDefault(msg, 1, ""),
    derivationPath: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.services.bria.v1.KeychainConfig.Wpkh}
 */
proto.services.bria.v1.KeychainConfig.Wpkh.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.KeychainConfig.Wpkh;
  return proto.services.bria.v1.KeychainConfig.Wpkh.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.KeychainConfig.Wpkh} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.KeychainConfig.Wpkh}
 */
proto.services.bria.v1.KeychainConfig.Wpkh.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setXpub(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDerivationPath(value);
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
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.KeychainConfig.Wpkh.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.KeychainConfig.Wpkh} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.Wpkh.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getXpub();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
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
 * optional string xpub = 1;
 * @return {string}
 */
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.getXpub = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.KeychainConfig.Wpkh} returns this
 */
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.setXpub = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string derivation_path = 2;
 * @return {string}
 */
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.getDerivationPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.KeychainConfig.Wpkh} returns this
 */
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.setDerivationPath = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.KeychainConfig.Wpkh} returns this
 */
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.clearDerivationPath = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.KeychainConfig.Wpkh.prototype.hasDerivationPath = function() {
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
proto.services.bria.v1.KeychainConfig.Descriptors.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.KeychainConfig.Descriptors.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.KeychainConfig.Descriptors} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.Descriptors.toObject = function(includeInstance, msg) {
  var f, obj = {
    external: jspb.Message.getFieldWithDefault(msg, 1, ""),
    internal: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.services.bria.v1.KeychainConfig.Descriptors}
 */
proto.services.bria.v1.KeychainConfig.Descriptors.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.KeychainConfig.Descriptors;
  return proto.services.bria.v1.KeychainConfig.Descriptors.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.KeychainConfig.Descriptors} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.KeychainConfig.Descriptors}
 */
proto.services.bria.v1.KeychainConfig.Descriptors.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternal(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setInternal(value);
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
proto.services.bria.v1.KeychainConfig.Descriptors.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.KeychainConfig.Descriptors.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.KeychainConfig.Descriptors} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.Descriptors.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExternal();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getInternal();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string external = 1;
 * @return {string}
 */
proto.services.bria.v1.KeychainConfig.Descriptors.prototype.getExternal = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.KeychainConfig.Descriptors} returns this
 */
proto.services.bria.v1.KeychainConfig.Descriptors.prototype.setExternal = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string internal = 2;
 * @return {string}
 */
proto.services.bria.v1.KeychainConfig.Descriptors.prototype.getInternal = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.KeychainConfig.Descriptors} returns this
 */
proto.services.bria.v1.KeychainConfig.Descriptors.prototype.setInternal = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.repeatedFields_ = [1];



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
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.KeychainConfig.SortedMultisig.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.KeychainConfig.SortedMultisig} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.toObject = function(includeInstance, msg) {
  var f, obj = {
    xpubsList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f,
    threshold: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.services.bria.v1.KeychainConfig.SortedMultisig}
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.KeychainConfig.SortedMultisig;
  return proto.services.bria.v1.KeychainConfig.SortedMultisig.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.KeychainConfig.SortedMultisig} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.KeychainConfig.SortedMultisig}
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addXpubs(value);
      break;
    case 2:
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
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.KeychainConfig.SortedMultisig.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.KeychainConfig.SortedMultisig} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getXpubsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
  f = message.getThreshold();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
};


/**
 * repeated string xpubs = 1;
 * @return {!Array<string>}
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.getXpubsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.services.bria.v1.KeychainConfig.SortedMultisig} returns this
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.setXpubsList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.KeychainConfig.SortedMultisig} returns this
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.addXpubs = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.KeychainConfig.SortedMultisig} returns this
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.clearXpubsList = function() {
  return this.setXpubsList([]);
};


/**
 * optional uint32 threshold = 2;
 * @return {number}
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.getThreshold = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.KeychainConfig.SortedMultisig} returns this
 */
proto.services.bria.v1.KeychainConfig.SortedMultisig.prototype.setThreshold = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional Wpkh wpkh = 1;
 * @return {?proto.services.bria.v1.KeychainConfig.Wpkh}
 */
proto.services.bria.v1.KeychainConfig.prototype.getWpkh = function() {
  return /** @type{?proto.services.bria.v1.KeychainConfig.Wpkh} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.KeychainConfig.Wpkh, 1));
};


/**
 * @param {?proto.services.bria.v1.KeychainConfig.Wpkh|undefined} value
 * @return {!proto.services.bria.v1.KeychainConfig} returns this
*/
proto.services.bria.v1.KeychainConfig.prototype.setWpkh = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.services.bria.v1.KeychainConfig.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.KeychainConfig} returns this
 */
proto.services.bria.v1.KeychainConfig.prototype.clearWpkh = function() {
  return this.setWpkh(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.KeychainConfig.prototype.hasWpkh = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Descriptors descriptors = 2;
 * @return {?proto.services.bria.v1.KeychainConfig.Descriptors}
 */
proto.services.bria.v1.KeychainConfig.prototype.getDescriptors = function() {
  return /** @type{?proto.services.bria.v1.KeychainConfig.Descriptors} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.KeychainConfig.Descriptors, 2));
};


/**
 * @param {?proto.services.bria.v1.KeychainConfig.Descriptors|undefined} value
 * @return {!proto.services.bria.v1.KeychainConfig} returns this
*/
proto.services.bria.v1.KeychainConfig.prototype.setDescriptors = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.services.bria.v1.KeychainConfig.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.KeychainConfig} returns this
 */
proto.services.bria.v1.KeychainConfig.prototype.clearDescriptors = function() {
  return this.setDescriptors(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.KeychainConfig.prototype.hasDescriptors = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional SortedMultisig sorted_multisig = 3;
 * @return {?proto.services.bria.v1.KeychainConfig.SortedMultisig}
 */
proto.services.bria.v1.KeychainConfig.prototype.getSortedMultisig = function() {
  return /** @type{?proto.services.bria.v1.KeychainConfig.SortedMultisig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.KeychainConfig.SortedMultisig, 3));
};


/**
 * @param {?proto.services.bria.v1.KeychainConfig.SortedMultisig|undefined} value
 * @return {!proto.services.bria.v1.KeychainConfig} returns this
*/
proto.services.bria.v1.KeychainConfig.prototype.setSortedMultisig = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.services.bria.v1.KeychainConfig.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.KeychainConfig} returns this
 */
proto.services.bria.v1.KeychainConfig.prototype.clearSortedMultisig = function() {
  return this.setSortedMultisig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.KeychainConfig.prototype.hasSortedMultisig = function() {
  return jspb.Message.getField(this, 3) != null;
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
proto.services.bria.v1.CreateWalletRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreateWalletRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreateWalletRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateWalletRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    keychainConfig: (f = msg.getKeychainConfig()) && proto.services.bria.v1.KeychainConfig.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.CreateWalletRequest}
 */
proto.services.bria.v1.CreateWalletRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreateWalletRequest;
  return proto.services.bria.v1.CreateWalletRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreateWalletRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreateWalletRequest}
 */
proto.services.bria.v1.CreateWalletRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.KeychainConfig;
      reader.readMessage(value,proto.services.bria.v1.KeychainConfig.deserializeBinaryFromReader);
      msg.setKeychainConfig(value);
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
proto.services.bria.v1.CreateWalletRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreateWalletRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreateWalletRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateWalletRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKeychainConfig();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.services.bria.v1.KeychainConfig.serializeBinaryToWriter
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.services.bria.v1.CreateWalletRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreateWalletRequest} returns this
 */
proto.services.bria.v1.CreateWalletRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional KeychainConfig keychain_config = 2;
 * @return {?proto.services.bria.v1.KeychainConfig}
 */
proto.services.bria.v1.CreateWalletRequest.prototype.getKeychainConfig = function() {
  return /** @type{?proto.services.bria.v1.KeychainConfig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.KeychainConfig, 2));
};


/**
 * @param {?proto.services.bria.v1.KeychainConfig|undefined} value
 * @return {!proto.services.bria.v1.CreateWalletRequest} returns this
*/
proto.services.bria.v1.CreateWalletRequest.prototype.setKeychainConfig = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.CreateWalletRequest} returns this
 */
proto.services.bria.v1.CreateWalletRequest.prototype.clearKeychainConfig = function() {
  return this.setKeychainConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.CreateWalletRequest.prototype.hasKeychainConfig = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.CreateWalletResponse.repeatedFields_ = [2];



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
proto.services.bria.v1.CreateWalletResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreateWalletResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreateWalletResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateWalletResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    xpubIdsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f
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
 * @return {!proto.services.bria.v1.CreateWalletResponse}
 */
proto.services.bria.v1.CreateWalletResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreateWalletResponse;
  return proto.services.bria.v1.CreateWalletResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreateWalletResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreateWalletResponse}
 */
proto.services.bria.v1.CreateWalletResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addXpubIds(value);
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
proto.services.bria.v1.CreateWalletResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreateWalletResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreateWalletResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreateWalletResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getXpubIdsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.CreateWalletResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreateWalletResponse} returns this
 */
proto.services.bria.v1.CreateWalletResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string xpub_ids = 2;
 * @return {!Array<string>}
 */
proto.services.bria.v1.CreateWalletResponse.prototype.getXpubIdsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.services.bria.v1.CreateWalletResponse} returns this
 */
proto.services.bria.v1.CreateWalletResponse.prototype.setXpubIdsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.CreateWalletResponse} returns this
 */
proto.services.bria.v1.CreateWalletResponse.prototype.addXpubIds = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.CreateWalletResponse} returns this
 */
proto.services.bria.v1.CreateWalletResponse.prototype.clearXpubIdsList = function() {
  return this.setXpubIdsList([]);
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
proto.services.bria.v1.ListWalletsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListWalletsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListWalletsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListWalletsRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.ListWalletsRequest}
 */
proto.services.bria.v1.ListWalletsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListWalletsRequest;
  return proto.services.bria.v1.ListWalletsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListWalletsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListWalletsRequest}
 */
proto.services.bria.v1.ListWalletsRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.ListWalletsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListWalletsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListWalletsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListWalletsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.ListWalletsResponse.repeatedFields_ = [1];



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
proto.services.bria.v1.ListWalletsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListWalletsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListWalletsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListWalletsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletsList: jspb.Message.toObjectList(msg.getWalletsList(),
    proto.services.bria.v1.Wallet.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.ListWalletsResponse}
 */
proto.services.bria.v1.ListWalletsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListWalletsResponse;
  return proto.services.bria.v1.ListWalletsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListWalletsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListWalletsResponse}
 */
proto.services.bria.v1.ListWalletsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.Wallet;
      reader.readMessage(value,proto.services.bria.v1.Wallet.deserializeBinaryFromReader);
      msg.addWallets(value);
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
proto.services.bria.v1.ListWalletsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListWalletsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListWalletsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListWalletsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.services.bria.v1.Wallet.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Wallet wallets = 1;
 * @return {!Array<!proto.services.bria.v1.Wallet>}
 */
proto.services.bria.v1.ListWalletsResponse.prototype.getWalletsList = function() {
  return /** @type{!Array<!proto.services.bria.v1.Wallet>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.Wallet, 1));
};


/**
 * @param {!Array<!proto.services.bria.v1.Wallet>} value
 * @return {!proto.services.bria.v1.ListWalletsResponse} returns this
*/
proto.services.bria.v1.ListWalletsResponse.prototype.setWalletsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.services.bria.v1.Wallet=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.Wallet}
 */
proto.services.bria.v1.ListWalletsResponse.prototype.addWallets = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.services.bria.v1.Wallet, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.ListWalletsResponse} returns this
 */
proto.services.bria.v1.ListWalletsResponse.prototype.clearWalletsList = function() {
  return this.setWalletsList([]);
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
proto.services.bria.v1.Wallet.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.Wallet.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.Wallet} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Wallet.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    name: jspb.Message.getFieldWithDefault(msg, 2, ""),
    config: (f = msg.getConfig()) && proto.services.bria.v1.WalletConfig.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.Wallet}
 */
proto.services.bria.v1.Wallet.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.Wallet;
  return proto.services.bria.v1.Wallet.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.Wallet} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.Wallet}
 */
proto.services.bria.v1.Wallet.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 3:
      var value = new proto.services.bria.v1.WalletConfig;
      reader.readMessage(value,proto.services.bria.v1.WalletConfig.deserializeBinaryFromReader);
      msg.setConfig(value);
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
proto.services.bria.v1.Wallet.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.Wallet.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.Wallet} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Wallet.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getConfig();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.bria.v1.WalletConfig.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.Wallet.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Wallet} returns this
 */
proto.services.bria.v1.Wallet.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.services.bria.v1.Wallet.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Wallet} returns this
 */
proto.services.bria.v1.Wallet.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional WalletConfig config = 3;
 * @return {?proto.services.bria.v1.WalletConfig}
 */
proto.services.bria.v1.Wallet.prototype.getConfig = function() {
  return /** @type{?proto.services.bria.v1.WalletConfig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.WalletConfig, 3));
};


/**
 * @param {?proto.services.bria.v1.WalletConfig|undefined} value
 * @return {!proto.services.bria.v1.Wallet} returns this
*/
proto.services.bria.v1.Wallet.prototype.setConfig = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.Wallet} returns this
 */
proto.services.bria.v1.Wallet.prototype.clearConfig = function() {
  return this.setConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Wallet.prototype.hasConfig = function() {
  return jspb.Message.getField(this, 3) != null;
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
proto.services.bria.v1.WalletConfig.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.WalletConfig.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.WalletConfig} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.WalletConfig.toObject = function(includeInstance, msg) {
  var f, obj = {
    settleIncomeAfterNConfs: jspb.Message.getFieldWithDefault(msg, 1, 0),
    settleChangeAfterNConfs: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.services.bria.v1.WalletConfig}
 */
proto.services.bria.v1.WalletConfig.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.WalletConfig;
  return proto.services.bria.v1.WalletConfig.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.WalletConfig} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.WalletConfig}
 */
proto.services.bria.v1.WalletConfig.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setSettleIncomeAfterNConfs(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setSettleChangeAfterNConfs(value);
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
proto.services.bria.v1.WalletConfig.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.WalletConfig.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.WalletConfig} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.WalletConfig.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSettleIncomeAfterNConfs();
  if (f !== 0) {
    writer.writeUint32(
      1,
      f
    );
  }
  f = message.getSettleChangeAfterNConfs();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
};


/**
 * optional uint32 settle_income_after_n_confs = 1;
 * @return {number}
 */
proto.services.bria.v1.WalletConfig.prototype.getSettleIncomeAfterNConfs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.WalletConfig} returns this
 */
proto.services.bria.v1.WalletConfig.prototype.setSettleIncomeAfterNConfs = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint32 settle_change_after_n_confs = 2;
 * @return {number}
 */
proto.services.bria.v1.WalletConfig.prototype.getSettleChangeAfterNConfs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.WalletConfig} returns this
 */
proto.services.bria.v1.WalletConfig.prototype.setSettleChangeAfterNConfs = function(value) {
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
proto.services.bria.v1.NewAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.NewAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.NewAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.NewAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    externalId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    metadata: (f = msg.getMetadata()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.NewAddressRequest}
 */
proto.services.bria.v1.NewAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.NewAddressRequest;
  return proto.services.bria.v1.NewAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.NewAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.NewAddressRequest}
 */
proto.services.bria.v1.NewAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalId(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setMetadata(value);
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
proto.services.bria.v1.NewAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.NewAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.NewAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.NewAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string wallet_name = 1;
 * @return {string}
 */
proto.services.bria.v1.NewAddressRequest.prototype.getWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.NewAddressRequest} returns this
 */
proto.services.bria.v1.NewAddressRequest.prototype.setWalletName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string external_id = 2;
 * @return {string}
 */
proto.services.bria.v1.NewAddressRequest.prototype.getExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.NewAddressRequest} returns this
 */
proto.services.bria.v1.NewAddressRequest.prototype.setExternalId = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.NewAddressRequest} returns this
 */
proto.services.bria.v1.NewAddressRequest.prototype.clearExternalId = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.NewAddressRequest.prototype.hasExternalId = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional google.protobuf.Struct metadata = 3;
 * @return {?proto.google.protobuf.Struct}
 */
proto.services.bria.v1.NewAddressRequest.prototype.getMetadata = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 3));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.services.bria.v1.NewAddressRequest} returns this
*/
proto.services.bria.v1.NewAddressRequest.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.NewAddressRequest} returns this
 */
proto.services.bria.v1.NewAddressRequest.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.NewAddressRequest.prototype.hasMetadata = function() {
  return jspb.Message.getField(this, 3) != null;
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
proto.services.bria.v1.NewAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.NewAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.NewAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.NewAddressResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.NewAddressResponse}
 */
proto.services.bria.v1.NewAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.NewAddressResponse;
  return proto.services.bria.v1.NewAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.NewAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.NewAddressResponse}
 */
proto.services.bria.v1.NewAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
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
proto.services.bria.v1.NewAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.NewAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.NewAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.NewAddressResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string address = 1;
 * @return {string}
 */
proto.services.bria.v1.NewAddressResponse.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.NewAddressResponse} returns this
 */
proto.services.bria.v1.NewAddressResponse.prototype.setAddress = function(value) {
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
proto.services.bria.v1.UpdateAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UpdateAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UpdateAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 2, ""),
    newExternalId: jspb.Message.getFieldWithDefault(msg, 3, ""),
    newMetadata: (f = msg.getNewMetadata()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.UpdateAddressRequest}
 */
proto.services.bria.v1.UpdateAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UpdateAddressRequest;
  return proto.services.bria.v1.UpdateAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UpdateAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UpdateAddressRequest}
 */
proto.services.bria.v1.UpdateAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setNewExternalId(value);
      break;
    case 4:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setNewMetadata(value);
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
proto.services.bria.v1.UpdateAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UpdateAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UpdateAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getNewMetadata();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string address = 2;
 * @return {string}
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UpdateAddressRequest} returns this
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string new_external_id = 3;
 * @return {string}
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.getNewExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UpdateAddressRequest} returns this
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.setNewExternalId = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.UpdateAddressRequest} returns this
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.clearNewExternalId = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.hasNewExternalId = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional google.protobuf.Struct new_metadata = 4;
 * @return {?proto.google.protobuf.Struct}
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.getNewMetadata = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 4));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.services.bria.v1.UpdateAddressRequest} returns this
*/
proto.services.bria.v1.UpdateAddressRequest.prototype.setNewMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.UpdateAddressRequest} returns this
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.clearNewMetadata = function() {
  return this.setNewMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.UpdateAddressRequest.prototype.hasNewMetadata = function() {
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
proto.services.bria.v1.UpdateAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UpdateAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UpdateAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateAddressResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.UpdateAddressResponse}
 */
proto.services.bria.v1.UpdateAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UpdateAddressResponse;
  return proto.services.bria.v1.UpdateAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UpdateAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UpdateAddressResponse}
 */
proto.services.bria.v1.UpdateAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.UpdateAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UpdateAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UpdateAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdateAddressResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.ListAddressesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListAddressesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListAddressesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListAddressesRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletName: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.ListAddressesRequest}
 */
proto.services.bria.v1.ListAddressesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListAddressesRequest;
  return proto.services.bria.v1.ListAddressesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListAddressesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListAddressesRequest}
 */
proto.services.bria.v1.ListAddressesRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletName(value);
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
proto.services.bria.v1.ListAddressesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListAddressesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListAddressesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListAddressesRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string wallet_name = 1;
 * @return {string}
 */
proto.services.bria.v1.ListAddressesRequest.prototype.getWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ListAddressesRequest} returns this
 */
proto.services.bria.v1.ListAddressesRequest.prototype.setWalletName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.ListAddressesResponse.repeatedFields_ = [2];



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
proto.services.bria.v1.ListAddressesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListAddressesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListAddressesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListAddressesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    addressesList: jspb.Message.toObjectList(msg.getAddressesList(),
    proto.services.bria.v1.WalletAddress.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.ListAddressesResponse}
 */
proto.services.bria.v1.ListAddressesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListAddressesResponse;
  return proto.services.bria.v1.ListAddressesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListAddressesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListAddressesResponse}
 */
proto.services.bria.v1.ListAddressesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.WalletAddress;
      reader.readMessage(value,proto.services.bria.v1.WalletAddress.deserializeBinaryFromReader);
      msg.addAddresses(value);
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
proto.services.bria.v1.ListAddressesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListAddressesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListAddressesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListAddressesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAddressesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.services.bria.v1.WalletAddress.serializeBinaryToWriter
    );
  }
};


/**
 * optional string wallet_id = 1;
 * @return {string}
 */
proto.services.bria.v1.ListAddressesResponse.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ListAddressesResponse} returns this
 */
proto.services.bria.v1.ListAddressesResponse.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated WalletAddress addresses = 2;
 * @return {!Array<!proto.services.bria.v1.WalletAddress>}
 */
proto.services.bria.v1.ListAddressesResponse.prototype.getAddressesList = function() {
  return /** @type{!Array<!proto.services.bria.v1.WalletAddress>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.WalletAddress, 2));
};


/**
 * @param {!Array<!proto.services.bria.v1.WalletAddress>} value
 * @return {!proto.services.bria.v1.ListAddressesResponse} returns this
*/
proto.services.bria.v1.ListAddressesResponse.prototype.setAddressesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.services.bria.v1.WalletAddress=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.WalletAddress}
 */
proto.services.bria.v1.ListAddressesResponse.prototype.addAddresses = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.services.bria.v1.WalletAddress, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.ListAddressesResponse} returns this
 */
proto.services.bria.v1.ListAddressesResponse.prototype.clearAddressesList = function() {
  return this.setAddressesList([]);
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
proto.services.bria.v1.WalletAddress.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.WalletAddress.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.WalletAddress} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.WalletAddress.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, ""),
    externalId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    metadata: (f = msg.getMetadata()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.WalletAddress}
 */
proto.services.bria.v1.WalletAddress.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.WalletAddress;
  return proto.services.bria.v1.WalletAddress.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.WalletAddress} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.WalletAddress}
 */
proto.services.bria.v1.WalletAddress.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalId(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setMetadata(value);
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
proto.services.bria.v1.WalletAddress.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.WalletAddress.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.WalletAddress} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.WalletAddress.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getExternalId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string address = 1;
 * @return {string}
 */
proto.services.bria.v1.WalletAddress.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.WalletAddress} returns this
 */
proto.services.bria.v1.WalletAddress.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string external_id = 2;
 * @return {string}
 */
proto.services.bria.v1.WalletAddress.prototype.getExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.WalletAddress} returns this
 */
proto.services.bria.v1.WalletAddress.prototype.setExternalId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional google.protobuf.Struct metadata = 3;
 * @return {?proto.google.protobuf.Struct}
 */
proto.services.bria.v1.WalletAddress.prototype.getMetadata = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 3));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.services.bria.v1.WalletAddress} returns this
*/
proto.services.bria.v1.WalletAddress.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.WalletAddress} returns this
 */
proto.services.bria.v1.WalletAddress.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.WalletAddress.prototype.hasMetadata = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.GetAddressRequest.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.services.bria.v1.GetAddressRequest.IdentifierCase = {
  IDENTIFIER_NOT_SET: 0,
  ADDRESS: 1,
  EXTERNAL_ID: 2
};

/**
 * @return {proto.services.bria.v1.GetAddressRequest.IdentifierCase}
 */
proto.services.bria.v1.GetAddressRequest.prototype.getIdentifierCase = function() {
  return /** @type {proto.services.bria.v1.GetAddressRequest.IdentifierCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.GetAddressRequest.oneofGroups_[0]));
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
proto.services.bria.v1.GetAddressRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetAddressRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetAddressRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAddressRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, ""),
    externalId: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.services.bria.v1.GetAddressRequest}
 */
proto.services.bria.v1.GetAddressRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetAddressRequest;
  return proto.services.bria.v1.GetAddressRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetAddressRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetAddressRequest}
 */
proto.services.bria.v1.GetAddressRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalId(value);
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
proto.services.bria.v1.GetAddressRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetAddressRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetAddressRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAddressRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
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
 * optional string address = 1;
 * @return {string}
 */
proto.services.bria.v1.GetAddressRequest.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetAddressRequest} returns this
 */
proto.services.bria.v1.GetAddressRequest.prototype.setAddress = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.services.bria.v1.GetAddressRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.GetAddressRequest} returns this
 */
proto.services.bria.v1.GetAddressRequest.prototype.clearAddress = function() {
  return jspb.Message.setOneofField(this, 1, proto.services.bria.v1.GetAddressRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetAddressRequest.prototype.hasAddress = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string external_id = 2;
 * @return {string}
 */
proto.services.bria.v1.GetAddressRequest.prototype.getExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetAddressRequest} returns this
 */
proto.services.bria.v1.GetAddressRequest.prototype.setExternalId = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.services.bria.v1.GetAddressRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.GetAddressRequest} returns this
 */
proto.services.bria.v1.GetAddressRequest.prototype.clearExternalId = function() {
  return jspb.Message.setOneofField(this, 2, proto.services.bria.v1.GetAddressRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetAddressRequest.prototype.hasExternalId = function() {
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
proto.services.bria.v1.GetAddressResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetAddressResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetAddressResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAddressResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    address: jspb.Message.getFieldWithDefault(msg, 1, ""),
    walletId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    changeAddress: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
    externalId: jspb.Message.getFieldWithDefault(msg, 4, ""),
    metadata: (f = msg.getMetadata()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.GetAddressResponse}
 */
proto.services.bria.v1.GetAddressResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetAddressResponse;
  return proto.services.bria.v1.GetAddressResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetAddressResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetAddressResponse}
 */
proto.services.bria.v1.GetAddressResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setChangeAddress(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalId(value);
      break;
    case 5:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setMetadata(value);
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
proto.services.bria.v1.GetAddressResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetAddressResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetAddressResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAddressResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getChangeAddress();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string address = 1;
 * @return {string}
 */
proto.services.bria.v1.GetAddressResponse.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
 */
proto.services.bria.v1.GetAddressResponse.prototype.setAddress = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
 */
proto.services.bria.v1.GetAddressResponse.prototype.clearAddress = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetAddressResponse.prototype.hasAddress = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string wallet_id = 2;
 * @return {string}
 */
proto.services.bria.v1.GetAddressResponse.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
 */
proto.services.bria.v1.GetAddressResponse.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional bool change_address = 3;
 * @return {boolean}
 */
proto.services.bria.v1.GetAddressResponse.prototype.getChangeAddress = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
 */
proto.services.bria.v1.GetAddressResponse.prototype.setChangeAddress = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional string external_id = 4;
 * @return {string}
 */
proto.services.bria.v1.GetAddressResponse.prototype.getExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
 */
proto.services.bria.v1.GetAddressResponse.prototype.setExternalId = function(value) {
  return jspb.Message.setField(this, 4, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
 */
proto.services.bria.v1.GetAddressResponse.prototype.clearExternalId = function() {
  return jspb.Message.setField(this, 4, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetAddressResponse.prototype.hasExternalId = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional google.protobuf.Struct metadata = 5;
 * @return {?proto.google.protobuf.Struct}
 */
proto.services.bria.v1.GetAddressResponse.prototype.getMetadata = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 5));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
*/
proto.services.bria.v1.GetAddressResponse.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.GetAddressResponse} returns this
 */
proto.services.bria.v1.GetAddressResponse.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetAddressResponse.prototype.hasMetadata = function() {
  return jspb.Message.getField(this, 5) != null;
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
proto.services.bria.v1.ListUtxosRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListUtxosRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListUtxosRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListUtxosRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletName: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.ListUtxosRequest}
 */
proto.services.bria.v1.ListUtxosRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListUtxosRequest;
  return proto.services.bria.v1.ListUtxosRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListUtxosRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListUtxosRequest}
 */
proto.services.bria.v1.ListUtxosRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletName(value);
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
proto.services.bria.v1.ListUtxosRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListUtxosRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListUtxosRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListUtxosRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string wallet_name = 1;
 * @return {string}
 */
proto.services.bria.v1.ListUtxosRequest.prototype.getWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ListUtxosRequest} returns this
 */
proto.services.bria.v1.ListUtxosRequest.prototype.setWalletName = function(value) {
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
proto.services.bria.v1.Utxo.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.Utxo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.Utxo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Utxo.toObject = function(includeInstance, msg) {
  var f, obj = {
    outpoint: jspb.Message.getFieldWithDefault(msg, 1, ""),
    addressIdx: jspb.Message.getFieldWithDefault(msg, 2, 0),
    value: jspb.Message.getFieldWithDefault(msg, 3, 0),
    address: jspb.Message.getFieldWithDefault(msg, 4, ""),
    changeOutput: jspb.Message.getBooleanFieldWithDefault(msg, 5, false),
    blockHeight: jspb.Message.getFieldWithDefault(msg, 6, 0)
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
 * @return {!proto.services.bria.v1.Utxo}
 */
proto.services.bria.v1.Utxo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.Utxo;
  return proto.services.bria.v1.Utxo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.Utxo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.Utxo}
 */
proto.services.bria.v1.Utxo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setOutpoint(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setAddressIdx(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setValue(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setChangeOutput(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setBlockHeight(value);
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
proto.services.bria.v1.Utxo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.Utxo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.Utxo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Utxo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOutpoint();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAddressIdx();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
  f = message.getValue();
  if (f !== 0) {
    writer.writeUint64(
      3,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getChangeOutput();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeUint32(
      6,
      f
    );
  }
};


/**
 * optional string outpoint = 1;
 * @return {string}
 */
proto.services.bria.v1.Utxo.prototype.getOutpoint = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.setOutpoint = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 address_idx = 2;
 * @return {number}
 */
proto.services.bria.v1.Utxo.prototype.getAddressIdx = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.setAddressIdx = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint64 value = 3;
 * @return {number}
 */
proto.services.bria.v1.Utxo.prototype.getValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.setValue = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string address = 4;
 * @return {string}
 */
proto.services.bria.v1.Utxo.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.setAddress = function(value) {
  return jspb.Message.setField(this, 4, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.clearAddress = function() {
  return jspb.Message.setField(this, 4, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Utxo.prototype.hasAddress = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional bool change_output = 5;
 * @return {boolean}
 */
proto.services.bria.v1.Utxo.prototype.getChangeOutput = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.setChangeOutput = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};


/**
 * optional uint32 block_height = 6;
 * @return {number}
 */
proto.services.bria.v1.Utxo.prototype.getBlockHeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.setBlockHeight = function(value) {
  return jspb.Message.setField(this, 6, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.Utxo} returns this
 */
proto.services.bria.v1.Utxo.prototype.clearBlockHeight = function() {
  return jspb.Message.setField(this, 6, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Utxo.prototype.hasBlockHeight = function() {
  return jspb.Message.getField(this, 6) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.KeychainUtxos.repeatedFields_ = [2];



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
proto.services.bria.v1.KeychainUtxos.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.KeychainUtxos.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.KeychainUtxos} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainUtxos.toObject = function(includeInstance, msg) {
  var f, obj = {
    keychainId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    utxosList: jspb.Message.toObjectList(msg.getUtxosList(),
    proto.services.bria.v1.Utxo.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.KeychainUtxos}
 */
proto.services.bria.v1.KeychainUtxos.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.KeychainUtxos;
  return proto.services.bria.v1.KeychainUtxos.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.KeychainUtxos} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.KeychainUtxos}
 */
proto.services.bria.v1.KeychainUtxos.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setKeychainId(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.Utxo;
      reader.readMessage(value,proto.services.bria.v1.Utxo.deserializeBinaryFromReader);
      msg.addUtxos(value);
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
proto.services.bria.v1.KeychainUtxos.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.KeychainUtxos.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.KeychainUtxos} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.KeychainUtxos.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKeychainId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUtxosList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.services.bria.v1.Utxo.serializeBinaryToWriter
    );
  }
};


/**
 * optional string keychain_id = 1;
 * @return {string}
 */
proto.services.bria.v1.KeychainUtxos.prototype.getKeychainId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.KeychainUtxos} returns this
 */
proto.services.bria.v1.KeychainUtxos.prototype.setKeychainId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated Utxo utxos = 2;
 * @return {!Array<!proto.services.bria.v1.Utxo>}
 */
proto.services.bria.v1.KeychainUtxos.prototype.getUtxosList = function() {
  return /** @type{!Array<!proto.services.bria.v1.Utxo>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.Utxo, 2));
};


/**
 * @param {!Array<!proto.services.bria.v1.Utxo>} value
 * @return {!proto.services.bria.v1.KeychainUtxos} returns this
*/
proto.services.bria.v1.KeychainUtxos.prototype.setUtxosList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.services.bria.v1.Utxo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.Utxo}
 */
proto.services.bria.v1.KeychainUtxos.prototype.addUtxos = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.services.bria.v1.Utxo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.KeychainUtxos} returns this
 */
proto.services.bria.v1.KeychainUtxos.prototype.clearUtxosList = function() {
  return this.setUtxosList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.ListUtxosResponse.repeatedFields_ = [2];



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
proto.services.bria.v1.ListUtxosResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListUtxosResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListUtxosResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListUtxosResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    keychainsList: jspb.Message.toObjectList(msg.getKeychainsList(),
    proto.services.bria.v1.KeychainUtxos.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.ListUtxosResponse}
 */
proto.services.bria.v1.ListUtxosResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListUtxosResponse;
  return proto.services.bria.v1.ListUtxosResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListUtxosResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListUtxosResponse}
 */
proto.services.bria.v1.ListUtxosResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.KeychainUtxos;
      reader.readMessage(value,proto.services.bria.v1.KeychainUtxos.deserializeBinaryFromReader);
      msg.addKeychains(value);
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
proto.services.bria.v1.ListUtxosResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListUtxosResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListUtxosResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListUtxosResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getKeychainsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.services.bria.v1.KeychainUtxos.serializeBinaryToWriter
    );
  }
};


/**
 * optional string wallet_id = 1;
 * @return {string}
 */
proto.services.bria.v1.ListUtxosResponse.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ListUtxosResponse} returns this
 */
proto.services.bria.v1.ListUtxosResponse.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated KeychainUtxos keychains = 2;
 * @return {!Array<!proto.services.bria.v1.KeychainUtxos>}
 */
proto.services.bria.v1.ListUtxosResponse.prototype.getKeychainsList = function() {
  return /** @type{!Array<!proto.services.bria.v1.KeychainUtxos>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.KeychainUtxos, 2));
};


/**
 * @param {!Array<!proto.services.bria.v1.KeychainUtxos>} value
 * @return {!proto.services.bria.v1.ListUtxosResponse} returns this
*/
proto.services.bria.v1.ListUtxosResponse.prototype.setKeychainsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.services.bria.v1.KeychainUtxos=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.KeychainUtxos}
 */
proto.services.bria.v1.ListUtxosResponse.prototype.addKeychains = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.services.bria.v1.KeychainUtxos, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.ListUtxosResponse} returns this
 */
proto.services.bria.v1.ListUtxosResponse.prototype.clearKeychainsList = function() {
  return this.setKeychainsList([]);
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
proto.services.bria.v1.GetWalletBalanceSummaryRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetWalletBalanceSummaryRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetWalletBalanceSummaryRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetWalletBalanceSummaryRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletName: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryRequest}
 */
proto.services.bria.v1.GetWalletBalanceSummaryRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetWalletBalanceSummaryRequest;
  return proto.services.bria.v1.GetWalletBalanceSummaryRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetWalletBalanceSummaryRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryRequest}
 */
proto.services.bria.v1.GetWalletBalanceSummaryRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletName(value);
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
proto.services.bria.v1.GetWalletBalanceSummaryRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetWalletBalanceSummaryRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetWalletBalanceSummaryRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetWalletBalanceSummaryRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string wallet_name = 1;
 * @return {string}
 */
proto.services.bria.v1.GetWalletBalanceSummaryRequest.prototype.getWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryRequest} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryRequest.prototype.setWalletName = function(value) {
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
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetWalletBalanceSummaryResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    effectivePendingIncome: jspb.Message.getFieldWithDefault(msg, 1, 0),
    effectiveSettled: jspb.Message.getFieldWithDefault(msg, 2, 0),
    effectivePendingOutgoing: jspb.Message.getFieldWithDefault(msg, 3, 0),
    effectiveEncumberedOutgoing: jspb.Message.getFieldWithDefault(msg, 4, 0),
    utxoEncumberedIncoming: jspb.Message.getFieldWithDefault(msg, 5, 0),
    utxoPendingIncoming: jspb.Message.getFieldWithDefault(msg, 6, 0),
    utxoSettled: jspb.Message.getFieldWithDefault(msg, 7, 0),
    utxoPendingOutgoing: jspb.Message.getFieldWithDefault(msg, 8, 0),
    feesPending: jspb.Message.getFieldWithDefault(msg, 9, 0),
    feesEncumbered: jspb.Message.getFieldWithDefault(msg, 10, 0)
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
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetWalletBalanceSummaryResponse;
  return proto.services.bria.v1.GetWalletBalanceSummaryResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectivePendingIncome(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectiveSettled(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectivePendingOutgoing(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectiveEncumberedOutgoing(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoEncumberedIncoming(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoPendingIncoming(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoSettled(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoPendingOutgoing(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setFeesPending(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setFeesEncumbered(value);
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
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetWalletBalanceSummaryResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEffectivePendingIncome();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getEffectiveSettled();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
  f = message.getEffectivePendingOutgoing();
  if (f !== 0) {
    writer.writeUint64(
      3,
      f
    );
  }
  f = message.getEffectiveEncumberedOutgoing();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getUtxoEncumberedIncoming();
  if (f !== 0) {
    writer.writeUint64(
      5,
      f
    );
  }
  f = message.getUtxoPendingIncoming();
  if (f !== 0) {
    writer.writeUint64(
      6,
      f
    );
  }
  f = message.getUtxoSettled();
  if (f !== 0) {
    writer.writeUint64(
      7,
      f
    );
  }
  f = message.getUtxoPendingOutgoing();
  if (f !== 0) {
    writer.writeUint64(
      8,
      f
    );
  }
  f = message.getFeesPending();
  if (f !== 0) {
    writer.writeUint64(
      9,
      f
    );
  }
  f = message.getFeesEncumbered();
  if (f !== 0) {
    writer.writeUint64(
      10,
      f
    );
  }
};


/**
 * optional uint64 effective_pending_income = 1;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getEffectivePendingIncome = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setEffectivePendingIncome = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint64 effective_settled = 2;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getEffectiveSettled = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setEffectiveSettled = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint64 effective_pending_outgoing = 3;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getEffectivePendingOutgoing = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setEffectivePendingOutgoing = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint64 effective_encumbered_outgoing = 4;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getEffectiveEncumberedOutgoing = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setEffectiveEncumberedOutgoing = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional uint64 utxo_encumbered_incoming = 5;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getUtxoEncumberedIncoming = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setUtxoEncumberedIncoming = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional uint64 utxo_pending_incoming = 6;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getUtxoPendingIncoming = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setUtxoPendingIncoming = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional uint64 utxo_settled = 7;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getUtxoSettled = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setUtxoSettled = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional uint64 utxo_pending_outgoing = 8;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getUtxoPendingOutgoing = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setUtxoPendingOutgoing = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional uint64 fees_pending = 9;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getFeesPending = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setFeesPending = function(value) {
  return jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional uint64 fees_encumbered = 10;
 * @return {number}
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.getFeesEncumbered = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetWalletBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetWalletBalanceSummaryResponse.prototype.setFeesEncumbered = function(value) {
  return jspb.Message.setProto3IntField(this, 10, value);
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
proto.services.bria.v1.GetAccountBalanceSummaryRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetAccountBalanceSummaryRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetAccountBalanceSummaryRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAccountBalanceSummaryRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryRequest}
 */
proto.services.bria.v1.GetAccountBalanceSummaryRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetAccountBalanceSummaryRequest;
  return proto.services.bria.v1.GetAccountBalanceSummaryRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetAccountBalanceSummaryRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryRequest}
 */
proto.services.bria.v1.GetAccountBalanceSummaryRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.GetAccountBalanceSummaryRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetAccountBalanceSummaryRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetAccountBalanceSummaryRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAccountBalanceSummaryRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetAccountBalanceSummaryResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    effectivePendingIncome: jspb.Message.getFieldWithDefault(msg, 1, 0),
    effectiveSettled: jspb.Message.getFieldWithDefault(msg, 2, 0),
    effectivePendingOutgoing: jspb.Message.getFieldWithDefault(msg, 3, 0),
    effectiveEncumberedOutgoing: jspb.Message.getFieldWithDefault(msg, 4, 0),
    utxoEncumberedIncoming: jspb.Message.getFieldWithDefault(msg, 5, 0),
    utxoPendingIncoming: jspb.Message.getFieldWithDefault(msg, 6, 0),
    utxoSettled: jspb.Message.getFieldWithDefault(msg, 7, 0),
    utxoPendingOutgoing: jspb.Message.getFieldWithDefault(msg, 8, 0),
    feesPending: jspb.Message.getFieldWithDefault(msg, 9, 0),
    feesEncumbered: jspb.Message.getFieldWithDefault(msg, 10, 0)
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
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetAccountBalanceSummaryResponse;
  return proto.services.bria.v1.GetAccountBalanceSummaryResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectivePendingIncome(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectiveSettled(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectivePendingOutgoing(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setEffectiveEncumberedOutgoing(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoEncumberedIncoming(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoPendingIncoming(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoSettled(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setUtxoPendingOutgoing(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setFeesPending(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setFeesEncumbered(value);
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
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetAccountBalanceSummaryResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEffectivePendingIncome();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getEffectiveSettled();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
  f = message.getEffectivePendingOutgoing();
  if (f !== 0) {
    writer.writeUint64(
      3,
      f
    );
  }
  f = message.getEffectiveEncumberedOutgoing();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getUtxoEncumberedIncoming();
  if (f !== 0) {
    writer.writeUint64(
      5,
      f
    );
  }
  f = message.getUtxoPendingIncoming();
  if (f !== 0) {
    writer.writeUint64(
      6,
      f
    );
  }
  f = message.getUtxoSettled();
  if (f !== 0) {
    writer.writeUint64(
      7,
      f
    );
  }
  f = message.getUtxoPendingOutgoing();
  if (f !== 0) {
    writer.writeUint64(
      8,
      f
    );
  }
  f = message.getFeesPending();
  if (f !== 0) {
    writer.writeUint64(
      9,
      f
    );
  }
  f = message.getFeesEncumbered();
  if (f !== 0) {
    writer.writeUint64(
      10,
      f
    );
  }
};


/**
 * optional uint64 effective_pending_income = 1;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getEffectivePendingIncome = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setEffectivePendingIncome = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint64 effective_settled = 2;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getEffectiveSettled = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setEffectiveSettled = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint64 effective_pending_outgoing = 3;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getEffectivePendingOutgoing = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setEffectivePendingOutgoing = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint64 effective_encumbered_outgoing = 4;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getEffectiveEncumberedOutgoing = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setEffectiveEncumberedOutgoing = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional uint64 utxo_encumbered_incoming = 5;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getUtxoEncumberedIncoming = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setUtxoEncumberedIncoming = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional uint64 utxo_pending_incoming = 6;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getUtxoPendingIncoming = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setUtxoPendingIncoming = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional uint64 utxo_settled = 7;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getUtxoSettled = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setUtxoSettled = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional uint64 utxo_pending_outgoing = 8;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getUtxoPendingOutgoing = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setUtxoPendingOutgoing = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional uint64 fees_pending = 9;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getFeesPending = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setFeesPending = function(value) {
  return jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional uint64 fees_encumbered = 10;
 * @return {number}
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.getFeesEncumbered = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.GetAccountBalanceSummaryResponse} returns this
 */
proto.services.bria.v1.GetAccountBalanceSummaryResponse.prototype.setFeesEncumbered = function(value) {
  return jspb.Message.setProto3IntField(this, 10, value);
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
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreatePayoutQueueRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreatePayoutQueueRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreatePayoutQueueRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    description: jspb.Message.getFieldWithDefault(msg, 2, ""),
    config: (f = msg.getConfig()) && proto.services.bria.v1.PayoutQueueConfig.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.CreatePayoutQueueRequest}
 */
proto.services.bria.v1.CreatePayoutQueueRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreatePayoutQueueRequest;
  return proto.services.bria.v1.CreatePayoutQueueRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreatePayoutQueueRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreatePayoutQueueRequest}
 */
proto.services.bria.v1.CreatePayoutQueueRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 3:
      var value = new proto.services.bria.v1.PayoutQueueConfig;
      reader.readMessage(value,proto.services.bria.v1.PayoutQueueConfig.deserializeBinaryFromReader);
      msg.setConfig(value);
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
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreatePayoutQueueRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreatePayoutQueueRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreatePayoutQueueRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getConfig();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.bria.v1.PayoutQueueConfig.serializeBinaryToWriter
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string description = 2;
 * @return {string}
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.setDescription = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.CreatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.clearDescription = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.hasDescription = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional PayoutQueueConfig config = 3;
 * @return {?proto.services.bria.v1.PayoutQueueConfig}
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.getConfig = function() {
  return /** @type{?proto.services.bria.v1.PayoutQueueConfig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutQueueConfig, 3));
};


/**
 * @param {?proto.services.bria.v1.PayoutQueueConfig|undefined} value
 * @return {!proto.services.bria.v1.CreatePayoutQueueRequest} returns this
*/
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.setConfig = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.CreatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.clearConfig = function() {
  return this.setConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.CreatePayoutQueueRequest.prototype.hasConfig = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.PayoutQueueConfig.oneofGroups_ = [[4,5]];

/**
 * @enum {number}
 */
proto.services.bria.v1.PayoutQueueConfig.TriggerCase = {
  TRIGGER_NOT_SET: 0,
  MANUAL: 4,
  INTERVAL_SECS: 5
};

/**
 * @return {proto.services.bria.v1.PayoutQueueConfig.TriggerCase}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getTriggerCase = function() {
  return /** @type {proto.services.bria.v1.PayoutQueueConfig.TriggerCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.PayoutQueueConfig.oneofGroups_[0]));
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
proto.services.bria.v1.PayoutQueueConfig.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutQueueConfig.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutQueueConfig} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutQueueConfig.toObject = function(includeInstance, msg) {
  var f, obj = {
    txPriority: jspb.Message.getFieldWithDefault(msg, 1, 0),
    consolidateDeprecatedKeychains: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
    manual: jspb.Message.getBooleanFieldWithDefault(msg, 4, false),
    intervalSecs: jspb.Message.getFieldWithDefault(msg, 5, 0),
    cpfpPayoutsAfterMins: jspb.Message.getFieldWithDefault(msg, 6, 0),
    cpfpPayoutsAfterBlocks: jspb.Message.getFieldWithDefault(msg, 7, 0),
    forceMinChangeSats: jspb.Message.getFieldWithDefault(msg, 8, 0)
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
 * @return {!proto.services.bria.v1.PayoutQueueConfig}
 */
proto.services.bria.v1.PayoutQueueConfig.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutQueueConfig;
  return proto.services.bria.v1.PayoutQueueConfig.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutQueueConfig} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutQueueConfig}
 */
proto.services.bria.v1.PayoutQueueConfig.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.services.bria.v1.TxPriority} */ (reader.readEnum());
      msg.setTxPriority(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setConsolidateDeprecatedKeychains(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setManual(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setIntervalSecs(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setCpfpPayoutsAfterMins(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setCpfpPayoutsAfterBlocks(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setForceMinChangeSats(value);
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
proto.services.bria.v1.PayoutQueueConfig.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutQueueConfig.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutQueueConfig} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutQueueConfig.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTxPriority();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getConsolidateDeprecatedKeychains();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeBool(
      4,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeUint32(
      5,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeUint32(
      6,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeUint32(
      7,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 8));
  if (f != null) {
    writer.writeUint64(
      8,
      f
    );
  }
};


/**
 * optional TxPriority tx_priority = 1;
 * @return {!proto.services.bria.v1.TxPriority}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getTxPriority = function() {
  return /** @type {!proto.services.bria.v1.TxPriority} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.services.bria.v1.TxPriority} value
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.setTxPriority = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional bool consolidate_deprecated_keychains = 2;
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getConsolidateDeprecatedKeychains = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.setConsolidateDeprecatedKeychains = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional bool manual = 4;
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getManual = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.setManual = function(value) {
  return jspb.Message.setOneofField(this, 4, proto.services.bria.v1.PayoutQueueConfig.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.clearManual = function() {
  return jspb.Message.setOneofField(this, 4, proto.services.bria.v1.PayoutQueueConfig.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.hasManual = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional uint32 interval_secs = 5;
 * @return {number}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getIntervalSecs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.setIntervalSecs = function(value) {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.PayoutQueueConfig.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.clearIntervalSecs = function() {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.PayoutQueueConfig.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.hasIntervalSecs = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional uint32 cpfp_payouts_after_mins = 6;
 * @return {number}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getCpfpPayoutsAfterMins = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.setCpfpPayoutsAfterMins = function(value) {
  return jspb.Message.setField(this, 6, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.clearCpfpPayoutsAfterMins = function() {
  return jspb.Message.setField(this, 6, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.hasCpfpPayoutsAfterMins = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional uint32 cpfp_payouts_after_blocks = 7;
 * @return {number}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getCpfpPayoutsAfterBlocks = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.setCpfpPayoutsAfterBlocks = function(value) {
  return jspb.Message.setField(this, 7, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.clearCpfpPayoutsAfterBlocks = function() {
  return jspb.Message.setField(this, 7, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.hasCpfpPayoutsAfterBlocks = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional uint64 force_min_change_sats = 8;
 * @return {number}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.getForceMinChangeSats = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.setForceMinChangeSats = function(value) {
  return jspb.Message.setField(this, 8, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutQueueConfig} returns this
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.clearForceMinChangeSats = function() {
  return jspb.Message.setField(this, 8, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueueConfig.prototype.hasForceMinChangeSats = function() {
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
proto.services.bria.v1.CreatePayoutQueueResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CreatePayoutQueueResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CreatePayoutQueueResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreatePayoutQueueResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.CreatePayoutQueueResponse}
 */
proto.services.bria.v1.CreatePayoutQueueResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CreatePayoutQueueResponse;
  return proto.services.bria.v1.CreatePayoutQueueResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CreatePayoutQueueResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CreatePayoutQueueResponse}
 */
proto.services.bria.v1.CreatePayoutQueueResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
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
proto.services.bria.v1.CreatePayoutQueueResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CreatePayoutQueueResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CreatePayoutQueueResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CreatePayoutQueueResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.CreatePayoutQueueResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CreatePayoutQueueResponse} returns this
 */
proto.services.bria.v1.CreatePayoutQueueResponse.prototype.setId = function(value) {
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
proto.services.bria.v1.TriggerPayoutQueueRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.TriggerPayoutQueueRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.TriggerPayoutQueueRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.TriggerPayoutQueueRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.TriggerPayoutQueueRequest}
 */
proto.services.bria.v1.TriggerPayoutQueueRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.TriggerPayoutQueueRequest;
  return proto.services.bria.v1.TriggerPayoutQueueRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.TriggerPayoutQueueRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.TriggerPayoutQueueRequest}
 */
proto.services.bria.v1.TriggerPayoutQueueRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
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
proto.services.bria.v1.TriggerPayoutQueueRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.TriggerPayoutQueueRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.TriggerPayoutQueueRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.TriggerPayoutQueueRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.services.bria.v1.TriggerPayoutQueueRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.TriggerPayoutQueueRequest} returns this
 */
proto.services.bria.v1.TriggerPayoutQueueRequest.prototype.setName = function(value) {
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
proto.services.bria.v1.TriggerPayoutQueueResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.TriggerPayoutQueueResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.TriggerPayoutQueueResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.TriggerPayoutQueueResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.TriggerPayoutQueueResponse}
 */
proto.services.bria.v1.TriggerPayoutQueueResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.TriggerPayoutQueueResponse;
  return proto.services.bria.v1.TriggerPayoutQueueResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.TriggerPayoutQueueResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.TriggerPayoutQueueResponse}
 */
proto.services.bria.v1.TriggerPayoutQueueResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.TriggerPayoutQueueResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.TriggerPayoutQueueResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.TriggerPayoutQueueResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.TriggerPayoutQueueResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.PayoutQueue.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutQueue.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutQueue} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutQueue.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    name: jspb.Message.getFieldWithDefault(msg, 2, ""),
    description: jspb.Message.getFieldWithDefault(msg, 3, ""),
    config: (f = msg.getConfig()) && proto.services.bria.v1.PayoutQueueConfig.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.PayoutQueue}
 */
proto.services.bria.v1.PayoutQueue.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutQueue;
  return proto.services.bria.v1.PayoutQueue.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutQueue} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutQueue}
 */
proto.services.bria.v1.PayoutQueue.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 4:
      var value = new proto.services.bria.v1.PayoutQueueConfig;
      reader.readMessage(value,proto.services.bria.v1.PayoutQueueConfig.deserializeBinaryFromReader);
      msg.setConfig(value);
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
proto.services.bria.v1.PayoutQueue.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutQueue.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutQueue} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutQueue.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getConfig();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.services.bria.v1.PayoutQueueConfig.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.PayoutQueue.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutQueue} returns this
 */
proto.services.bria.v1.PayoutQueue.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.services.bria.v1.PayoutQueue.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutQueue} returns this
 */
proto.services.bria.v1.PayoutQueue.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string description = 3;
 * @return {string}
 */
proto.services.bria.v1.PayoutQueue.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutQueue} returns this
 */
proto.services.bria.v1.PayoutQueue.prototype.setDescription = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutQueue} returns this
 */
proto.services.bria.v1.PayoutQueue.prototype.clearDescription = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueue.prototype.hasDescription = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional PayoutQueueConfig config = 4;
 * @return {?proto.services.bria.v1.PayoutQueueConfig}
 */
proto.services.bria.v1.PayoutQueue.prototype.getConfig = function() {
  return /** @type{?proto.services.bria.v1.PayoutQueueConfig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutQueueConfig, 4));
};


/**
 * @param {?proto.services.bria.v1.PayoutQueueConfig|undefined} value
 * @return {!proto.services.bria.v1.PayoutQueue} returns this
*/
proto.services.bria.v1.PayoutQueue.prototype.setConfig = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.PayoutQueue} returns this
 */
proto.services.bria.v1.PayoutQueue.prototype.clearConfig = function() {
  return this.setConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutQueue.prototype.hasConfig = function() {
  return jspb.Message.getField(this, 4) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.ListPayoutQueuesResponse.repeatedFields_ = [1];



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
proto.services.bria.v1.ListPayoutQueuesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListPayoutQueuesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListPayoutQueuesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutQueuesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    payoutQueuesList: jspb.Message.toObjectList(msg.getPayoutQueuesList(),
    proto.services.bria.v1.PayoutQueue.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.ListPayoutQueuesResponse}
 */
proto.services.bria.v1.ListPayoutQueuesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListPayoutQueuesResponse;
  return proto.services.bria.v1.ListPayoutQueuesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListPayoutQueuesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListPayoutQueuesResponse}
 */
proto.services.bria.v1.ListPayoutQueuesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.PayoutQueue;
      reader.readMessage(value,proto.services.bria.v1.PayoutQueue.deserializeBinaryFromReader);
      msg.addPayoutQueues(value);
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
proto.services.bria.v1.ListPayoutQueuesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListPayoutQueuesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListPayoutQueuesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutQueuesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPayoutQueuesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.services.bria.v1.PayoutQueue.serializeBinaryToWriter
    );
  }
};


/**
 * repeated PayoutQueue payout_queues = 1;
 * @return {!Array<!proto.services.bria.v1.PayoutQueue>}
 */
proto.services.bria.v1.ListPayoutQueuesResponse.prototype.getPayoutQueuesList = function() {
  return /** @type{!Array<!proto.services.bria.v1.PayoutQueue>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.PayoutQueue, 1));
};


/**
 * @param {!Array<!proto.services.bria.v1.PayoutQueue>} value
 * @return {!proto.services.bria.v1.ListPayoutQueuesResponse} returns this
*/
proto.services.bria.v1.ListPayoutQueuesResponse.prototype.setPayoutQueuesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.services.bria.v1.PayoutQueue=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.PayoutQueue}
 */
proto.services.bria.v1.ListPayoutQueuesResponse.prototype.addPayoutQueues = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.services.bria.v1.PayoutQueue, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.ListPayoutQueuesResponse} returns this
 */
proto.services.bria.v1.ListPayoutQueuesResponse.prototype.clearPayoutQueuesList = function() {
  return this.setPayoutQueuesList([]);
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
proto.services.bria.v1.ListPayoutQueuesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListPayoutQueuesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListPayoutQueuesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutQueuesRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.ListPayoutQueuesRequest}
 */
proto.services.bria.v1.ListPayoutQueuesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListPayoutQueuesRequest;
  return proto.services.bria.v1.ListPayoutQueuesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListPayoutQueuesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListPayoutQueuesRequest}
 */
proto.services.bria.v1.ListPayoutQueuesRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.ListPayoutQueuesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListPayoutQueuesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListPayoutQueuesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutQueuesRequest.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UpdatePayoutQueueRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UpdatePayoutQueueRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    newDescription: jspb.Message.getFieldWithDefault(msg, 2, ""),
    newConfig: (f = msg.getNewConfig()) && proto.services.bria.v1.PayoutQueueConfig.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.UpdatePayoutQueueRequest}
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UpdatePayoutQueueRequest;
  return proto.services.bria.v1.UpdatePayoutQueueRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UpdatePayoutQueueRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UpdatePayoutQueueRequest}
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setNewDescription(value);
      break;
    case 3:
      var value = new proto.services.bria.v1.PayoutQueueConfig;
      reader.readMessage(value,proto.services.bria.v1.PayoutQueueConfig.deserializeBinaryFromReader);
      msg.setNewConfig(value);
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
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UpdatePayoutQueueRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UpdatePayoutQueueRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getNewConfig();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.bria.v1.PayoutQueueConfig.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UpdatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string new_description = 2;
 * @return {string}
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.getNewDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UpdatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.setNewDescription = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.UpdatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.clearNewDescription = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.hasNewDescription = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional PayoutQueueConfig new_config = 3;
 * @return {?proto.services.bria.v1.PayoutQueueConfig}
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.getNewConfig = function() {
  return /** @type{?proto.services.bria.v1.PayoutQueueConfig} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutQueueConfig, 3));
};


/**
 * @param {?proto.services.bria.v1.PayoutQueueConfig|undefined} value
 * @return {!proto.services.bria.v1.UpdatePayoutQueueRequest} returns this
*/
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.setNewConfig = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.UpdatePayoutQueueRequest} returns this
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.clearNewConfig = function() {
  return this.setNewConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.UpdatePayoutQueueRequest.prototype.hasNewConfig = function() {
  return jspb.Message.getField(this, 3) != null;
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
proto.services.bria.v1.UpdatePayoutQueueResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UpdatePayoutQueueResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UpdatePayoutQueueResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdatePayoutQueueResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.UpdatePayoutQueueResponse}
 */
proto.services.bria.v1.UpdatePayoutQueueResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UpdatePayoutQueueResponse;
  return proto.services.bria.v1.UpdatePayoutQueueResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UpdatePayoutQueueResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UpdatePayoutQueueResponse}
 */
proto.services.bria.v1.UpdatePayoutQueueResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.UpdatePayoutQueueResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UpdatePayoutQueueResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UpdatePayoutQueueResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UpdatePayoutQueueResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.EstimatePayoutFeeRequest.oneofGroups_ = [[3,5]];

/**
 * @enum {number}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 3,
  DESTINATION_WALLET_NAME: 5
};

/**
 * @return {proto.services.bria.v1.EstimatePayoutFeeRequest.DestinationCase}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.EstimatePayoutFeeRequest.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.EstimatePayoutFeeRequest.oneofGroups_[0]));
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
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.EstimatePayoutFeeRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.EstimatePayoutFeeRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    payoutQueueName: jspb.Message.getFieldWithDefault(msg, 2, ""),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 3, ""),
    destinationWalletName: jspb.Message.getFieldWithDefault(msg, 5, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 4, 0)
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
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.EstimatePayoutFeeRequest;
  return proto.services.bria.v1.EstimatePayoutFeeRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.EstimatePayoutFeeRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setDestinationWalletName(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
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
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.EstimatePayoutFeeRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.EstimatePayoutFeeRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPayoutQueueName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
};


/**
 * optional string wallet_name = 1;
 * @return {string}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.getWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.setWalletName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string payout_queue_name = 2;
 * @return {string}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.getPayoutQueueName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.setPayoutQueueName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string onchain_address = 3;
 * @return {string}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 3, proto.services.bria.v1.EstimatePayoutFeeRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 3, proto.services.bria.v1.EstimatePayoutFeeRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional string destination_wallet_name = 5;
 * @return {string}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.getDestinationWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.setDestinationWalletName = function(value) {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.EstimatePayoutFeeRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.clearDestinationWalletName = function() {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.EstimatePayoutFeeRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.hasDestinationWalletName = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional uint64 satoshis = 4;
 * @return {number}
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.EstimatePayoutFeeRequest} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeRequest.prototype.setSatoshis = function(value) {
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
proto.services.bria.v1.EstimatePayoutFeeResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.EstimatePayoutFeeResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.EstimatePayoutFeeResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.EstimatePayoutFeeResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    satoshis: jspb.Message.getFieldWithDefault(msg, 1, 0)
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
 * @return {!proto.services.bria.v1.EstimatePayoutFeeResponse}
 */
proto.services.bria.v1.EstimatePayoutFeeResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.EstimatePayoutFeeResponse;
  return proto.services.bria.v1.EstimatePayoutFeeResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.EstimatePayoutFeeResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.EstimatePayoutFeeResponse}
 */
proto.services.bria.v1.EstimatePayoutFeeResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
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
proto.services.bria.v1.EstimatePayoutFeeResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.EstimatePayoutFeeResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.EstimatePayoutFeeResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.EstimatePayoutFeeResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
};


/**
 * optional uint64 satoshis = 1;
 * @return {number}
 */
proto.services.bria.v1.EstimatePayoutFeeResponse.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.EstimatePayoutFeeResponse} returns this
 */
proto.services.bria.v1.EstimatePayoutFeeResponse.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.SubmitPayoutRequest.oneofGroups_ = [[3,7]];

/**
 * @enum {number}
 */
proto.services.bria.v1.SubmitPayoutRequest.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 3,
  DESTINATION_WALLET_NAME: 7
};

/**
 * @return {proto.services.bria.v1.SubmitPayoutRequest.DestinationCase}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.SubmitPayoutRequest.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.SubmitPayoutRequest.oneofGroups_[0]));
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
proto.services.bria.v1.SubmitPayoutRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SubmitPayoutRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SubmitPayoutRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitPayoutRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletName: jspb.Message.getFieldWithDefault(msg, 1, ""),
    payoutQueueName: jspb.Message.getFieldWithDefault(msg, 2, ""),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 3, ""),
    destinationWalletName: jspb.Message.getFieldWithDefault(msg, 7, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 4, 0),
    externalId: jspb.Message.getFieldWithDefault(msg, 5, ""),
    metadata: (f = msg.getMetadata()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.SubmitPayoutRequest}
 */
proto.services.bria.v1.SubmitPayoutRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SubmitPayoutRequest;
  return proto.services.bria.v1.SubmitPayoutRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SubmitPayoutRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SubmitPayoutRequest}
 */
proto.services.bria.v1.SubmitPayoutRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setDestinationWalletName(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalId(value);
      break;
    case 6:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setMetadata(value);
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
proto.services.bria.v1.SubmitPayoutRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SubmitPayoutRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SubmitPayoutRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitPayoutRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPayoutQueueName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string wallet_name = 1;
 * @return {string}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.setWalletName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string payout_queue_name = 2;
 * @return {string}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getPayoutQueueName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.setPayoutQueueName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string onchain_address = 3;
 * @return {string}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 3, proto.services.bria.v1.SubmitPayoutRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 3, proto.services.bria.v1.SubmitPayoutRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional string destination_wallet_name = 7;
 * @return {string}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getDestinationWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.setDestinationWalletName = function(value) {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.SubmitPayoutRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.clearDestinationWalletName = function() {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.SubmitPayoutRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.hasDestinationWalletName = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional uint64 satoshis = 4;
 * @return {number}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string external_id = 5;
 * @return {string}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.setExternalId = function(value) {
  return jspb.Message.setField(this, 5, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.clearExternalId = function() {
  return jspb.Message.setField(this, 5, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.hasExternalId = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional google.protobuf.Struct metadata = 6;
 * @return {?proto.google.protobuf.Struct}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.getMetadata = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 6));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
*/
proto.services.bria.v1.SubmitPayoutRequest.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.SubmitPayoutRequest} returns this
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SubmitPayoutRequest.prototype.hasMetadata = function() {
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
proto.services.bria.v1.SubmitPayoutResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SubmitPayoutResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SubmitPayoutResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitPayoutResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    batchInclusionEstimatedAt: jspb.Message.getFieldWithDefault(msg, 2, 0)
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
 * @return {!proto.services.bria.v1.SubmitPayoutResponse}
 */
proto.services.bria.v1.SubmitPayoutResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SubmitPayoutResponse;
  return proto.services.bria.v1.SubmitPayoutResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SubmitPayoutResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SubmitPayoutResponse}
 */
proto.services.bria.v1.SubmitPayoutResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setBatchInclusionEstimatedAt(value);
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
proto.services.bria.v1.SubmitPayoutResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SubmitPayoutResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SubmitPayoutResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubmitPayoutResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeUint32(
      2,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.SubmitPayoutResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SubmitPayoutResponse} returns this
 */
proto.services.bria.v1.SubmitPayoutResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint32 batch_inclusion_estimated_at = 2;
 * @return {number}
 */
proto.services.bria.v1.SubmitPayoutResponse.prototype.getBatchInclusionEstimatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.SubmitPayoutResponse} returns this
 */
proto.services.bria.v1.SubmitPayoutResponse.prototype.setBatchInclusionEstimatedAt = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SubmitPayoutResponse} returns this
 */
proto.services.bria.v1.SubmitPayoutResponse.prototype.clearBatchInclusionEstimatedAt = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SubmitPayoutResponse.prototype.hasBatchInclusionEstimatedAt = function() {
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
proto.services.bria.v1.ListPayoutsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListPayoutsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListPayoutsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletName: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.ListPayoutsRequest}
 */
proto.services.bria.v1.ListPayoutsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListPayoutsRequest;
  return proto.services.bria.v1.ListPayoutsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListPayoutsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListPayoutsRequest}
 */
proto.services.bria.v1.ListPayoutsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletName(value);
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
proto.services.bria.v1.ListPayoutsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListPayoutsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListPayoutsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string wallet_name = 1;
 * @return {string}
 */
proto.services.bria.v1.ListPayoutsRequest.prototype.getWalletName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.ListPayoutsRequest} returns this
 */
proto.services.bria.v1.ListPayoutsRequest.prototype.setWalletName = function(value) {
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
proto.services.bria.v1.BriaWalletDestination.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.BriaWalletDestination.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.BriaWalletDestination} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BriaWalletDestination.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    address: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.BriaWalletDestination.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.BriaWalletDestination;
  return proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.BriaWalletDestination} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
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
proto.services.bria.v1.BriaWalletDestination.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.BriaWalletDestination} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string wallet_id = 1;
 * @return {string}
 */
proto.services.bria.v1.BriaWalletDestination.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.BriaWalletDestination} returns this
 */
proto.services.bria.v1.BriaWalletDestination.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string address = 2;
 * @return {string}
 */
proto.services.bria.v1.BriaWalletDestination.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.BriaWalletDestination} returns this
 */
proto.services.bria.v1.BriaWalletDestination.prototype.setAddress = function(value) {
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
proto.services.bria.v1.Payout.oneofGroups_ = [[6,10]];

/**
 * @enum {number}
 */
proto.services.bria.v1.Payout.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 6,
  WALLET: 10
};

/**
 * @return {proto.services.bria.v1.Payout.DestinationCase}
 */
proto.services.bria.v1.Payout.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.Payout.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.Payout.oneofGroups_[0]));
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
proto.services.bria.v1.Payout.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.Payout.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.Payout} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Payout.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    walletId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    payoutQueueId: jspb.Message.getFieldWithDefault(msg, 3, ""),
    batchId: jspb.Message.getFieldWithDefault(msg, 4, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 5, 0),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 6, ""),
    wallet: (f = msg.getWallet()) && proto.services.bria.v1.BriaWalletDestination.toObject(includeInstance, f),
    cancelled: jspb.Message.getBooleanFieldWithDefault(msg, 9, false),
    externalId: jspb.Message.getFieldWithDefault(msg, 7, ""),
    metadata: (f = msg.getMetadata()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
    batchInclusionEstimatedAt: jspb.Message.getFieldWithDefault(msg, 11, 0)
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
 * @return {!proto.services.bria.v1.Payout}
 */
proto.services.bria.v1.Payout.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.Payout;
  return proto.services.bria.v1.Payout.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.Payout} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.Payout}
 */
proto.services.bria.v1.Payout.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueId(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setBatchId(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 10:
      var value = new proto.services.bria.v1.BriaWalletDestination;
      reader.readMessage(value,proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader);
      msg.setWallet(value);
      break;
    case 9:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setCancelled(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalId(value);
      break;
    case 8:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setMetadata(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setBatchInclusionEstimatedAt(value);
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
proto.services.bria.v1.Payout.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.Payout.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.Payout} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Payout.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getPayoutQueueId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      5,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getWallet();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter
    );
  }
  f = message.getCancelled();
  if (f) {
    writer.writeBool(
      9,
      f
    );
  }
  f = message.getExternalId();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getMetadata();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 11));
  if (f != null) {
    writer.writeUint32(
      11,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.Payout.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string wallet_id = 2;
 * @return {string}
 */
proto.services.bria.v1.Payout.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string payout_queue_id = 3;
 * @return {string}
 */
proto.services.bria.v1.Payout.prototype.getPayoutQueueId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setPayoutQueueId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string batch_id = 4;
 * @return {string}
 */
proto.services.bria.v1.Payout.prototype.getBatchId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setBatchId = function(value) {
  return jspb.Message.setField(this, 4, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.clearBatchId = function() {
  return jspb.Message.setField(this, 4, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Payout.prototype.hasBatchId = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional uint64 satoshis = 5;
 * @return {number}
 */
proto.services.bria.v1.Payout.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional string onchain_address = 6;
 * @return {string}
 */
proto.services.bria.v1.Payout.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 6, proto.services.bria.v1.Payout.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 6, proto.services.bria.v1.Payout.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Payout.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional BriaWalletDestination wallet = 10;
 * @return {?proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.Payout.prototype.getWallet = function() {
  return /** @type{?proto.services.bria.v1.BriaWalletDestination} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BriaWalletDestination, 10));
};


/**
 * @param {?proto.services.bria.v1.BriaWalletDestination|undefined} value
 * @return {!proto.services.bria.v1.Payout} returns this
*/
proto.services.bria.v1.Payout.prototype.setWallet = function(value) {
  return jspb.Message.setOneofWrapperField(this, 10, proto.services.bria.v1.Payout.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.clearWallet = function() {
  return this.setWallet(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Payout.prototype.hasWallet = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional bool cancelled = 9;
 * @return {boolean}
 */
proto.services.bria.v1.Payout.prototype.getCancelled = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 9, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setCancelled = function(value) {
  return jspb.Message.setProto3BooleanField(this, 9, value);
};


/**
 * optional string external_id = 7;
 * @return {string}
 */
proto.services.bria.v1.Payout.prototype.getExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setExternalId = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional google.protobuf.Struct metadata = 8;
 * @return {?proto.google.protobuf.Struct}
 */
proto.services.bria.v1.Payout.prototype.getMetadata = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 8));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.services.bria.v1.Payout} returns this
*/
proto.services.bria.v1.Payout.prototype.setMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.clearMetadata = function() {
  return this.setMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Payout.prototype.hasMetadata = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional uint32 batch_inclusion_estimated_at = 11;
 * @return {number}
 */
proto.services.bria.v1.Payout.prototype.getBatchInclusionEstimatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 11, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.setBatchInclusionEstimatedAt = function(value) {
  return jspb.Message.setField(this, 11, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.Payout} returns this
 */
proto.services.bria.v1.Payout.prototype.clearBatchInclusionEstimatedAt = function() {
  return jspb.Message.setField(this, 11, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Payout.prototype.hasBatchInclusionEstimatedAt = function() {
  return jspb.Message.getField(this, 11) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.ListPayoutsResponse.repeatedFields_ = [1];



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
proto.services.bria.v1.ListPayoutsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListPayoutsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListPayoutsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    payoutsList: jspb.Message.toObjectList(msg.getPayoutsList(),
    proto.services.bria.v1.Payout.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.ListPayoutsResponse}
 */
proto.services.bria.v1.ListPayoutsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListPayoutsResponse;
  return proto.services.bria.v1.ListPayoutsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListPayoutsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListPayoutsResponse}
 */
proto.services.bria.v1.ListPayoutsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.Payout;
      reader.readMessage(value,proto.services.bria.v1.Payout.deserializeBinaryFromReader);
      msg.addPayouts(value);
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
proto.services.bria.v1.ListPayoutsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListPayoutsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListPayoutsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListPayoutsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPayoutsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.services.bria.v1.Payout.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Payout payouts = 1;
 * @return {!Array<!proto.services.bria.v1.Payout>}
 */
proto.services.bria.v1.ListPayoutsResponse.prototype.getPayoutsList = function() {
  return /** @type{!Array<!proto.services.bria.v1.Payout>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.Payout, 1));
};


/**
 * @param {!Array<!proto.services.bria.v1.Payout>} value
 * @return {!proto.services.bria.v1.ListPayoutsResponse} returns this
*/
proto.services.bria.v1.ListPayoutsResponse.prototype.setPayoutsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.services.bria.v1.Payout=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.Payout}
 */
proto.services.bria.v1.ListPayoutsResponse.prototype.addPayouts = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.services.bria.v1.Payout, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.ListPayoutsResponse} returns this
 */
proto.services.bria.v1.ListPayoutsResponse.prototype.clearPayoutsList = function() {
  return this.setPayoutsList([]);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.GetPayoutRequest.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.services.bria.v1.GetPayoutRequest.IdentifierCase = {
  IDENTIFIER_NOT_SET: 0,
  ID: 1,
  EXTERNAL_ID: 2
};

/**
 * @return {proto.services.bria.v1.GetPayoutRequest.IdentifierCase}
 */
proto.services.bria.v1.GetPayoutRequest.prototype.getIdentifierCase = function() {
  return /** @type {proto.services.bria.v1.GetPayoutRequest.IdentifierCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.GetPayoutRequest.oneofGroups_[0]));
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
proto.services.bria.v1.GetPayoutRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetPayoutRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetPayoutRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetPayoutRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    externalId: jspb.Message.getFieldWithDefault(msg, 2, "")
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
 * @return {!proto.services.bria.v1.GetPayoutRequest}
 */
proto.services.bria.v1.GetPayoutRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetPayoutRequest;
  return proto.services.bria.v1.GetPayoutRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetPayoutRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetPayoutRequest}
 */
proto.services.bria.v1.GetPayoutRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExternalId(value);
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
proto.services.bria.v1.GetPayoutRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetPayoutRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetPayoutRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetPayoutRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
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
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.GetPayoutRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetPayoutRequest} returns this
 */
proto.services.bria.v1.GetPayoutRequest.prototype.setId = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.services.bria.v1.GetPayoutRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.GetPayoutRequest} returns this
 */
proto.services.bria.v1.GetPayoutRequest.prototype.clearId = function() {
  return jspb.Message.setOneofField(this, 1, proto.services.bria.v1.GetPayoutRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetPayoutRequest.prototype.hasId = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string external_id = 2;
 * @return {string}
 */
proto.services.bria.v1.GetPayoutRequest.prototype.getExternalId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetPayoutRequest} returns this
 */
proto.services.bria.v1.GetPayoutRequest.prototype.setExternalId = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.services.bria.v1.GetPayoutRequest.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.GetPayoutRequest} returns this
 */
proto.services.bria.v1.GetPayoutRequest.prototype.clearExternalId = function() {
  return jspb.Message.setOneofField(this, 2, proto.services.bria.v1.GetPayoutRequest.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetPayoutRequest.prototype.hasExternalId = function() {
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
proto.services.bria.v1.GetPayoutResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetPayoutResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetPayoutResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetPayoutResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    payout: (f = msg.getPayout()) && proto.services.bria.v1.Payout.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.GetPayoutResponse}
 */
proto.services.bria.v1.GetPayoutResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetPayoutResponse;
  return proto.services.bria.v1.GetPayoutResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetPayoutResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetPayoutResponse}
 */
proto.services.bria.v1.GetPayoutResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.Payout;
      reader.readMessage(value,proto.services.bria.v1.Payout.deserializeBinaryFromReader);
      msg.setPayout(value);
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
proto.services.bria.v1.GetPayoutResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetPayoutResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetPayoutResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetPayoutResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPayout();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.bria.v1.Payout.serializeBinaryToWriter
    );
  }
};


/**
 * optional Payout payout = 1;
 * @return {?proto.services.bria.v1.Payout}
 */
proto.services.bria.v1.GetPayoutResponse.prototype.getPayout = function() {
  return /** @type{?proto.services.bria.v1.Payout} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.Payout, 1));
};


/**
 * @param {?proto.services.bria.v1.Payout|undefined} value
 * @return {!proto.services.bria.v1.GetPayoutResponse} returns this
*/
proto.services.bria.v1.GetPayoutResponse.prototype.setPayout = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.GetPayoutResponse} returns this
 */
proto.services.bria.v1.GetPayoutResponse.prototype.clearPayout = function() {
  return this.setPayout(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.GetPayoutResponse.prototype.hasPayout = function() {
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
proto.services.bria.v1.CancelPayoutRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CancelPayoutRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CancelPayoutRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CancelPayoutRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.CancelPayoutRequest}
 */
proto.services.bria.v1.CancelPayoutRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CancelPayoutRequest;
  return proto.services.bria.v1.CancelPayoutRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CancelPayoutRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CancelPayoutRequest}
 */
proto.services.bria.v1.CancelPayoutRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
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
proto.services.bria.v1.CancelPayoutRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CancelPayoutRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CancelPayoutRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CancelPayoutRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.CancelPayoutRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.CancelPayoutRequest} returns this
 */
proto.services.bria.v1.CancelPayoutRequest.prototype.setId = function(value) {
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
proto.services.bria.v1.CancelPayoutResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.CancelPayoutResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.CancelPayoutResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CancelPayoutResponse.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.CancelPayoutResponse}
 */
proto.services.bria.v1.CancelPayoutResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.CancelPayoutResponse;
  return proto.services.bria.v1.CancelPayoutResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.CancelPayoutResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.CancelPayoutResponse}
 */
proto.services.bria.v1.CancelPayoutResponse.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.CancelPayoutResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.CancelPayoutResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.CancelPayoutResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.CancelPayoutResponse.serializeBinaryToWriter = function(message, writer) {
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
proto.services.bria.v1.GetBatchRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetBatchRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetBatchRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetBatchRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, "")
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
 * @return {!proto.services.bria.v1.GetBatchRequest}
 */
proto.services.bria.v1.GetBatchRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetBatchRequest;
  return proto.services.bria.v1.GetBatchRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetBatchRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetBatchRequest}
 */
proto.services.bria.v1.GetBatchRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
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
proto.services.bria.v1.GetBatchRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetBatchRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetBatchRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetBatchRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.GetBatchRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetBatchRequest} returns this
 */
proto.services.bria.v1.GetBatchRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.GetBatchResponse.repeatedFields_ = [5,6];



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
proto.services.bria.v1.GetBatchResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.GetBatchResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.GetBatchResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetBatchResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    payoutQueueId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    txId: jspb.Message.getFieldWithDefault(msg, 3, ""),
    unsignedPsbt: jspb.Message.getFieldWithDefault(msg, 4, ""),
    walletSummariesList: jspb.Message.toObjectList(msg.getWalletSummariesList(),
    proto.services.bria.v1.BatchWalletSummary.toObject, includeInstance),
    signingSessionsList: jspb.Message.toObjectList(msg.getSigningSessionsList(),
    proto.services.bria.v1.SigningSession.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.GetBatchResponse}
 */
proto.services.bria.v1.GetBatchResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.GetBatchResponse;
  return proto.services.bria.v1.GetBatchResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.GetBatchResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.GetBatchResponse}
 */
proto.services.bria.v1.GetBatchResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setUnsignedPsbt(value);
      break;
    case 5:
      var value = new proto.services.bria.v1.BatchWalletSummary;
      reader.readMessage(value,proto.services.bria.v1.BatchWalletSummary.deserializeBinaryFromReader);
      msg.addWalletSummaries(value);
      break;
    case 6:
      var value = new proto.services.bria.v1.SigningSession;
      reader.readMessage(value,proto.services.bria.v1.SigningSession.deserializeBinaryFromReader);
      msg.addSigningSessions(value);
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
proto.services.bria.v1.GetBatchResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.GetBatchResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.GetBatchResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.GetBatchResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPayoutQueueId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getUnsignedPsbt();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getWalletSummariesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      5,
      f,
      proto.services.bria.v1.BatchWalletSummary.serializeBinaryToWriter
    );
  }
  f = message.getSigningSessionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      6,
      f,
      proto.services.bria.v1.SigningSession.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.GetBatchResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
 */
proto.services.bria.v1.GetBatchResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string payout_queue_id = 2;
 * @return {string}
 */
proto.services.bria.v1.GetBatchResponse.prototype.getPayoutQueueId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
 */
proto.services.bria.v1.GetBatchResponse.prototype.setPayoutQueueId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string tx_id = 3;
 * @return {string}
 */
proto.services.bria.v1.GetBatchResponse.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
 */
proto.services.bria.v1.GetBatchResponse.prototype.setTxId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string unsigned_psbt = 4;
 * @return {string}
 */
proto.services.bria.v1.GetBatchResponse.prototype.getUnsignedPsbt = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
 */
proto.services.bria.v1.GetBatchResponse.prototype.setUnsignedPsbt = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * repeated BatchWalletSummary wallet_summaries = 5;
 * @return {!Array<!proto.services.bria.v1.BatchWalletSummary>}
 */
proto.services.bria.v1.GetBatchResponse.prototype.getWalletSummariesList = function() {
  return /** @type{!Array<!proto.services.bria.v1.BatchWalletSummary>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.BatchWalletSummary, 5));
};


/**
 * @param {!Array<!proto.services.bria.v1.BatchWalletSummary>} value
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
*/
proto.services.bria.v1.GetBatchResponse.prototype.setWalletSummariesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 5, value);
};


/**
 * @param {!proto.services.bria.v1.BatchWalletSummary=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.BatchWalletSummary}
 */
proto.services.bria.v1.GetBatchResponse.prototype.addWalletSummaries = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.services.bria.v1.BatchWalletSummary, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
 */
proto.services.bria.v1.GetBatchResponse.prototype.clearWalletSummariesList = function() {
  return this.setWalletSummariesList([]);
};


/**
 * repeated SigningSession signing_sessions = 6;
 * @return {!Array<!proto.services.bria.v1.SigningSession>}
 */
proto.services.bria.v1.GetBatchResponse.prototype.getSigningSessionsList = function() {
  return /** @type{!Array<!proto.services.bria.v1.SigningSession>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.SigningSession, 6));
};


/**
 * @param {!Array<!proto.services.bria.v1.SigningSession>} value
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
*/
proto.services.bria.v1.GetBatchResponse.prototype.setSigningSessionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 6, value);
};


/**
 * @param {!proto.services.bria.v1.SigningSession=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.SigningSession}
 */
proto.services.bria.v1.GetBatchResponse.prototype.addSigningSessions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 6, opt_value, proto.services.bria.v1.SigningSession, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.GetBatchResponse} returns this
 */
proto.services.bria.v1.GetBatchResponse.prototype.clearSigningSessionsList = function() {
  return this.setSigningSessionsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.BatchWalletSummary.repeatedFields_ = [4];



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
proto.services.bria.v1.BatchWalletSummary.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.BatchWalletSummary.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.BatchWalletSummary} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BatchWalletSummary.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    totalSpentSats: jspb.Message.getFieldWithDefault(msg, 2, 0),
    feeSats: jspb.Message.getFieldWithDefault(msg, 3, 0),
    payoutsList: jspb.Message.toObjectList(msg.getPayoutsList(),
    proto.services.bria.v1.PayoutSummary.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.BatchWalletSummary}
 */
proto.services.bria.v1.BatchWalletSummary.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.BatchWalletSummary;
  return proto.services.bria.v1.BatchWalletSummary.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.BatchWalletSummary} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.BatchWalletSummary}
 */
proto.services.bria.v1.BatchWalletSummary.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setTotalSpentSats(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setFeeSats(value);
      break;
    case 4:
      var value = new proto.services.bria.v1.PayoutSummary;
      reader.readMessage(value,proto.services.bria.v1.PayoutSummary.deserializeBinaryFromReader);
      msg.addPayouts(value);
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
proto.services.bria.v1.BatchWalletSummary.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.BatchWalletSummary.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.BatchWalletSummary} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BatchWalletSummary.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTotalSpentSats();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
  f = message.getFeeSats();
  if (f !== 0) {
    writer.writeUint64(
      3,
      f
    );
  }
  f = message.getPayoutsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.services.bria.v1.PayoutSummary.serializeBinaryToWriter
    );
  }
};


/**
 * optional string wallet_id = 1;
 * @return {string}
 */
proto.services.bria.v1.BatchWalletSummary.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.BatchWalletSummary} returns this
 */
proto.services.bria.v1.BatchWalletSummary.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 total_spent_sats = 2;
 * @return {number}
 */
proto.services.bria.v1.BatchWalletSummary.prototype.getTotalSpentSats = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.BatchWalletSummary} returns this
 */
proto.services.bria.v1.BatchWalletSummary.prototype.setTotalSpentSats = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional uint64 fee_sats = 3;
 * @return {number}
 */
proto.services.bria.v1.BatchWalletSummary.prototype.getFeeSats = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.BatchWalletSummary} returns this
 */
proto.services.bria.v1.BatchWalletSummary.prototype.setFeeSats = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * repeated PayoutSummary payouts = 4;
 * @return {!Array<!proto.services.bria.v1.PayoutSummary>}
 */
proto.services.bria.v1.BatchWalletSummary.prototype.getPayoutsList = function() {
  return /** @type{!Array<!proto.services.bria.v1.PayoutSummary>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.PayoutSummary, 4));
};


/**
 * @param {!Array<!proto.services.bria.v1.PayoutSummary>} value
 * @return {!proto.services.bria.v1.BatchWalletSummary} returns this
*/
proto.services.bria.v1.BatchWalletSummary.prototype.setPayoutsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.services.bria.v1.PayoutSummary=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.PayoutSummary}
 */
proto.services.bria.v1.BatchWalletSummary.prototype.addPayouts = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.services.bria.v1.PayoutSummary, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.BatchWalletSummary} returns this
 */
proto.services.bria.v1.BatchWalletSummary.prototype.clearPayoutsList = function() {
  return this.setPayoutsList([]);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.PayoutSummary.oneofGroups_ = [[3,4]];

/**
 * @enum {number}
 */
proto.services.bria.v1.PayoutSummary.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 3,
  WALLET: 4
};

/**
 * @return {proto.services.bria.v1.PayoutSummary.DestinationCase}
 */
proto.services.bria.v1.PayoutSummary.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.PayoutSummary.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.PayoutSummary.oneofGroups_[0]));
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
proto.services.bria.v1.PayoutSummary.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutSummary.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutSummary} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutSummary.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 2, 0),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 3, ""),
    wallet: (f = msg.getWallet()) && proto.services.bria.v1.BriaWalletDestination.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.PayoutSummary}
 */
proto.services.bria.v1.PayoutSummary.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutSummary;
  return proto.services.bria.v1.PayoutSummary.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutSummary} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutSummary}
 */
proto.services.bria.v1.PayoutSummary.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 4:
      var value = new proto.services.bria.v1.BriaWalletDestination;
      reader.readMessage(value,proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader);
      msg.setWallet(value);
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
proto.services.bria.v1.PayoutSummary.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutSummary.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutSummary} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutSummary.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getWallet();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.PayoutSummary.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSummary} returns this
 */
proto.services.bria.v1.PayoutSummary.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional uint64 satoshis = 2;
 * @return {number}
 */
proto.services.bria.v1.PayoutSummary.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutSummary} returns this
 */
proto.services.bria.v1.PayoutSummary.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string onchain_address = 3;
 * @return {string}
 */
proto.services.bria.v1.PayoutSummary.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSummary} returns this
 */
proto.services.bria.v1.PayoutSummary.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 3, proto.services.bria.v1.PayoutSummary.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutSummary} returns this
 */
proto.services.bria.v1.PayoutSummary.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 3, proto.services.bria.v1.PayoutSummary.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutSummary.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional BriaWalletDestination wallet = 4;
 * @return {?proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.PayoutSummary.prototype.getWallet = function() {
  return /** @type{?proto.services.bria.v1.BriaWalletDestination} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BriaWalletDestination, 4));
};


/**
 * @param {?proto.services.bria.v1.BriaWalletDestination|undefined} value
 * @return {!proto.services.bria.v1.PayoutSummary} returns this
*/
proto.services.bria.v1.PayoutSummary.prototype.setWallet = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.services.bria.v1.PayoutSummary.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.PayoutSummary} returns this
 */
proto.services.bria.v1.PayoutSummary.prototype.clearWallet = function() {
  return this.setWallet(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutSummary.prototype.hasWallet = function() {
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
proto.services.bria.v1.SigningSession.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SigningSession.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SigningSession} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SigningSession.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    batchId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    xpubId: jspb.Message.getFieldWithDefault(msg, 3, ""),
    state: jspb.Message.getFieldWithDefault(msg, 4, ""),
    failureReason: jspb.Message.getFieldWithDefault(msg, 5, "")
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
 * @return {!proto.services.bria.v1.SigningSession}
 */
proto.services.bria.v1.SigningSession.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SigningSession;
  return proto.services.bria.v1.SigningSession.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SigningSession} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SigningSession}
 */
proto.services.bria.v1.SigningSession.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBatchId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setXpubId(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setState(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setFailureReason(value);
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
proto.services.bria.v1.SigningSession.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SigningSession.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SigningSession} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SigningSession.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getBatchId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getXpubId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getState();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.SigningSession.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SigningSession} returns this
 */
proto.services.bria.v1.SigningSession.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string batch_id = 2;
 * @return {string}
 */
proto.services.bria.v1.SigningSession.prototype.getBatchId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SigningSession} returns this
 */
proto.services.bria.v1.SigningSession.prototype.setBatchId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string xpub_id = 3;
 * @return {string}
 */
proto.services.bria.v1.SigningSession.prototype.getXpubId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SigningSession} returns this
 */
proto.services.bria.v1.SigningSession.prototype.setXpubId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string state = 4;
 * @return {string}
 */
proto.services.bria.v1.SigningSession.prototype.getState = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SigningSession} returns this
 */
proto.services.bria.v1.SigningSession.prototype.setState = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string failure_reason = 5;
 * @return {string}
 */
proto.services.bria.v1.SigningSession.prototype.getFailureReason = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.SigningSession} returns this
 */
proto.services.bria.v1.SigningSession.prototype.setFailureReason = function(value) {
  return jspb.Message.setField(this, 5, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SigningSession} returns this
 */
proto.services.bria.v1.SigningSession.prototype.clearFailureReason = function() {
  return jspb.Message.setField(this, 5, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SigningSession.prototype.hasFailureReason = function() {
  return jspb.Message.getField(this, 5) != null;
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
proto.services.bria.v1.ListXpubsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListXpubsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListXpubsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListXpubsRequest.toObject = function(includeInstance, msg) {
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
 * @return {!proto.services.bria.v1.ListXpubsRequest}
 */
proto.services.bria.v1.ListXpubsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListXpubsRequest;
  return proto.services.bria.v1.ListXpubsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListXpubsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListXpubsRequest}
 */
proto.services.bria.v1.ListXpubsRequest.deserializeBinaryFromReader = function(msg, reader) {
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
proto.services.bria.v1.ListXpubsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListXpubsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListXpubsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListXpubsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.services.bria.v1.ListXpubsResponse.repeatedFields_ = [1];



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
proto.services.bria.v1.ListXpubsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.ListXpubsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.ListXpubsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListXpubsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    xpubsList: jspb.Message.toObjectList(msg.getXpubsList(),
    proto.services.bria.v1.Xpub.toObject, includeInstance)
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
 * @return {!proto.services.bria.v1.ListXpubsResponse}
 */
proto.services.bria.v1.ListXpubsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.ListXpubsResponse;
  return proto.services.bria.v1.ListXpubsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.ListXpubsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.ListXpubsResponse}
 */
proto.services.bria.v1.ListXpubsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.Xpub;
      reader.readMessage(value,proto.services.bria.v1.Xpub.deserializeBinaryFromReader);
      msg.addXpubs(value);
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
proto.services.bria.v1.ListXpubsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.ListXpubsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.ListXpubsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.ListXpubsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getXpubsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.services.bria.v1.Xpub.serializeBinaryToWriter
    );
  }
};


/**
 * repeated Xpub xpubs = 1;
 * @return {!Array<!proto.services.bria.v1.Xpub>}
 */
proto.services.bria.v1.ListXpubsResponse.prototype.getXpubsList = function() {
  return /** @type{!Array<!proto.services.bria.v1.Xpub>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.services.bria.v1.Xpub, 1));
};


/**
 * @param {!Array<!proto.services.bria.v1.Xpub>} value
 * @return {!proto.services.bria.v1.ListXpubsResponse} returns this
*/
proto.services.bria.v1.ListXpubsResponse.prototype.setXpubsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.services.bria.v1.Xpub=} opt_value
 * @param {number=} opt_index
 * @return {!proto.services.bria.v1.Xpub}
 */
proto.services.bria.v1.ListXpubsResponse.prototype.addXpubs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.services.bria.v1.Xpub, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.services.bria.v1.ListXpubsResponse} returns this
 */
proto.services.bria.v1.ListXpubsResponse.prototype.clearXpubsList = function() {
  return this.setXpubsList([]);
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
proto.services.bria.v1.Xpub.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.Xpub.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.Xpub} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Xpub.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 4, ""),
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    xpub: jspb.Message.getFieldWithDefault(msg, 2, ""),
    derivationPath: jspb.Message.getFieldWithDefault(msg, 3, ""),
    hasSignerConfig: jspb.Message.getBooleanFieldWithDefault(msg, 5, false)
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
 * @return {!proto.services.bria.v1.Xpub}
 */
proto.services.bria.v1.Xpub.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.Xpub;
  return proto.services.bria.v1.Xpub.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.Xpub} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.Xpub}
 */
proto.services.bria.v1.Xpub.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setXpub(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDerivationPath(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setHasSignerConfig(value);
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
proto.services.bria.v1.Xpub.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.Xpub.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.Xpub} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.Xpub.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getXpub();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getHasSignerConfig();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
};


/**
 * optional string id = 4;
 * @return {string}
 */
proto.services.bria.v1.Xpub.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Xpub} returns this
 */
proto.services.bria.v1.Xpub.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.services.bria.v1.Xpub.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Xpub} returns this
 */
proto.services.bria.v1.Xpub.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string xpub = 2;
 * @return {string}
 */
proto.services.bria.v1.Xpub.prototype.getXpub = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Xpub} returns this
 */
proto.services.bria.v1.Xpub.prototype.setXpub = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string derivation_path = 3;
 * @return {string}
 */
proto.services.bria.v1.Xpub.prototype.getDerivationPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.Xpub} returns this
 */
proto.services.bria.v1.Xpub.prototype.setDerivationPath = function(value) {
  return jspb.Message.setField(this, 3, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.Xpub} returns this
 */
proto.services.bria.v1.Xpub.prototype.clearDerivationPath = function() {
  return jspb.Message.setField(this, 3, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.Xpub.prototype.hasDerivationPath = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional bool has_signer_config = 5;
 * @return {boolean}
 */
proto.services.bria.v1.Xpub.prototype.getHasSignerConfig = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.bria.v1.Xpub} returns this
 */
proto.services.bria.v1.Xpub.prototype.setHasSignerConfig = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
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
proto.services.bria.v1.SubscribeAllRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.SubscribeAllRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.SubscribeAllRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubscribeAllRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    afterSequence: jspb.Message.getFieldWithDefault(msg, 1, 0),
    augment: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
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
 * @return {!proto.services.bria.v1.SubscribeAllRequest}
 */
proto.services.bria.v1.SubscribeAllRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.SubscribeAllRequest;
  return proto.services.bria.v1.SubscribeAllRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.SubscribeAllRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.SubscribeAllRequest}
 */
proto.services.bria.v1.SubscribeAllRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setAfterSequence(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setAugment(value);
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
proto.services.bria.v1.SubscribeAllRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.SubscribeAllRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.SubscribeAllRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.SubscribeAllRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {number} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional uint64 after_sequence = 1;
 * @return {number}
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.getAfterSequence = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.SubscribeAllRequest} returns this
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.setAfterSequence = function(value) {
  return jspb.Message.setField(this, 1, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SubscribeAllRequest} returns this
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.clearAfterSequence = function() {
  return jspb.Message.setField(this, 1, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.hasAfterSequence = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bool augment = 2;
 * @return {boolean}
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.getAugment = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.services.bria.v1.SubscribeAllRequest} returns this
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.setAugment = function(value) {
  return jspb.Message.setField(this, 2, value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.SubscribeAllRequest} returns this
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.clearAugment = function() {
  return jspb.Message.setField(this, 2, undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.SubscribeAllRequest.prototype.hasAugment = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.BriaEvent.oneofGroups_ = [[4,5,10,6,11,7,8,9]];

/**
 * @enum {number}
 */
proto.services.bria.v1.BriaEvent.PayloadCase = {
  PAYLOAD_NOT_SET: 0,
  UTXO_DETECTED: 4,
  UTXO_SETTLED: 5,
  UTXO_DROPPED: 10,
  PAYOUT_SUBMITTED: 6,
  PAYOUT_CANCELLED: 11,
  PAYOUT_COMMITTED: 7,
  PAYOUT_BROADCAST: 8,
  PAYOUT_SETTLED: 9
};

/**
 * @return {proto.services.bria.v1.BriaEvent.PayloadCase}
 */
proto.services.bria.v1.BriaEvent.prototype.getPayloadCase = function() {
  return /** @type {proto.services.bria.v1.BriaEvent.PayloadCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.BriaEvent.oneofGroups_[0]));
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
proto.services.bria.v1.BriaEvent.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.BriaEvent.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.BriaEvent} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BriaEvent.toObject = function(includeInstance, msg) {
  var f, obj = {
    sequence: jspb.Message.getFieldWithDefault(msg, 1, 0),
    recordedAt: jspb.Message.getFieldWithDefault(msg, 2, 0),
    augmentation: (f = msg.getAugmentation()) && proto.services.bria.v1.EventAugmentation.toObject(includeInstance, f),
    utxoDetected: (f = msg.getUtxoDetected()) && proto.services.bria.v1.UtxoDetected.toObject(includeInstance, f),
    utxoSettled: (f = msg.getUtxoSettled()) && proto.services.bria.v1.UtxoSettled.toObject(includeInstance, f),
    utxoDropped: (f = msg.getUtxoDropped()) && proto.services.bria.v1.UtxoDropped.toObject(includeInstance, f),
    payoutSubmitted: (f = msg.getPayoutSubmitted()) && proto.services.bria.v1.PayoutSubmitted.toObject(includeInstance, f),
    payoutCancelled: (f = msg.getPayoutCancelled()) && proto.services.bria.v1.PayoutCancelled.toObject(includeInstance, f),
    payoutCommitted: (f = msg.getPayoutCommitted()) && proto.services.bria.v1.PayoutCommitted.toObject(includeInstance, f),
    payoutBroadcast: (f = msg.getPayoutBroadcast()) && proto.services.bria.v1.PayoutBroadcast.toObject(includeInstance, f),
    payoutSettled: (f = msg.getPayoutSettled()) && proto.services.bria.v1.PayoutSettled.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.BriaEvent}
 */
proto.services.bria.v1.BriaEvent.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.BriaEvent;
  return proto.services.bria.v1.BriaEvent.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.BriaEvent} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.BriaEvent}
 */
proto.services.bria.v1.BriaEvent.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSequence(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setRecordedAt(value);
      break;
    case 3:
      var value = new proto.services.bria.v1.EventAugmentation;
      reader.readMessage(value,proto.services.bria.v1.EventAugmentation.deserializeBinaryFromReader);
      msg.setAugmentation(value);
      break;
    case 4:
      var value = new proto.services.bria.v1.UtxoDetected;
      reader.readMessage(value,proto.services.bria.v1.UtxoDetected.deserializeBinaryFromReader);
      msg.setUtxoDetected(value);
      break;
    case 5:
      var value = new proto.services.bria.v1.UtxoSettled;
      reader.readMessage(value,proto.services.bria.v1.UtxoSettled.deserializeBinaryFromReader);
      msg.setUtxoSettled(value);
      break;
    case 10:
      var value = new proto.services.bria.v1.UtxoDropped;
      reader.readMessage(value,proto.services.bria.v1.UtxoDropped.deserializeBinaryFromReader);
      msg.setUtxoDropped(value);
      break;
    case 6:
      var value = new proto.services.bria.v1.PayoutSubmitted;
      reader.readMessage(value,proto.services.bria.v1.PayoutSubmitted.deserializeBinaryFromReader);
      msg.setPayoutSubmitted(value);
      break;
    case 11:
      var value = new proto.services.bria.v1.PayoutCancelled;
      reader.readMessage(value,proto.services.bria.v1.PayoutCancelled.deserializeBinaryFromReader);
      msg.setPayoutCancelled(value);
      break;
    case 7:
      var value = new proto.services.bria.v1.PayoutCommitted;
      reader.readMessage(value,proto.services.bria.v1.PayoutCommitted.deserializeBinaryFromReader);
      msg.setPayoutCommitted(value);
      break;
    case 8:
      var value = new proto.services.bria.v1.PayoutBroadcast;
      reader.readMessage(value,proto.services.bria.v1.PayoutBroadcast.deserializeBinaryFromReader);
      msg.setPayoutBroadcast(value);
      break;
    case 9:
      var value = new proto.services.bria.v1.PayoutSettled;
      reader.readMessage(value,proto.services.bria.v1.PayoutSettled.deserializeBinaryFromReader);
      msg.setPayoutSettled(value);
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
proto.services.bria.v1.BriaEvent.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.BriaEvent.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.BriaEvent} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.BriaEvent.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSequence();
  if (f !== 0) {
    writer.writeUint64(
      1,
      f
    );
  }
  f = message.getRecordedAt();
  if (f !== 0) {
    writer.writeUint32(
      2,
      f
    );
  }
  f = message.getAugmentation();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.services.bria.v1.EventAugmentation.serializeBinaryToWriter
    );
  }
  f = message.getUtxoDetected();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.services.bria.v1.UtxoDetected.serializeBinaryToWriter
    );
  }
  f = message.getUtxoSettled();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.services.bria.v1.UtxoSettled.serializeBinaryToWriter
    );
  }
  f = message.getUtxoDropped();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      proto.services.bria.v1.UtxoDropped.serializeBinaryToWriter
    );
  }
  f = message.getPayoutSubmitted();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.services.bria.v1.PayoutSubmitted.serializeBinaryToWriter
    );
  }
  f = message.getPayoutCancelled();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      proto.services.bria.v1.PayoutCancelled.serializeBinaryToWriter
    );
  }
  f = message.getPayoutCommitted();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.services.bria.v1.PayoutCommitted.serializeBinaryToWriter
    );
  }
  f = message.getPayoutBroadcast();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      proto.services.bria.v1.PayoutBroadcast.serializeBinaryToWriter
    );
  }
  f = message.getPayoutSettled();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.services.bria.v1.PayoutSettled.serializeBinaryToWriter
    );
  }
};


/**
 * optional uint64 sequence = 1;
 * @return {number}
 */
proto.services.bria.v1.BriaEvent.prototype.getSequence = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.setSequence = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional uint32 recorded_at = 2;
 * @return {number}
 */
proto.services.bria.v1.BriaEvent.prototype.getRecordedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.setRecordedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional EventAugmentation augmentation = 3;
 * @return {?proto.services.bria.v1.EventAugmentation}
 */
proto.services.bria.v1.BriaEvent.prototype.getAugmentation = function() {
  return /** @type{?proto.services.bria.v1.EventAugmentation} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.EventAugmentation, 3));
};


/**
 * @param {?proto.services.bria.v1.EventAugmentation|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setAugmentation = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearAugmentation = function() {
  return this.setAugmentation(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasAugmentation = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional UtxoDetected utxo_detected = 4;
 * @return {?proto.services.bria.v1.UtxoDetected}
 */
proto.services.bria.v1.BriaEvent.prototype.getUtxoDetected = function() {
  return /** @type{?proto.services.bria.v1.UtxoDetected} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.UtxoDetected, 4));
};


/**
 * @param {?proto.services.bria.v1.UtxoDetected|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setUtxoDetected = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearUtxoDetected = function() {
  return this.setUtxoDetected(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasUtxoDetected = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional UtxoSettled utxo_settled = 5;
 * @return {?proto.services.bria.v1.UtxoSettled}
 */
proto.services.bria.v1.BriaEvent.prototype.getUtxoSettled = function() {
  return /** @type{?proto.services.bria.v1.UtxoSettled} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.UtxoSettled, 5));
};


/**
 * @param {?proto.services.bria.v1.UtxoSettled|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setUtxoSettled = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearUtxoSettled = function() {
  return this.setUtxoSettled(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasUtxoSettled = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional UtxoDropped utxo_dropped = 10;
 * @return {?proto.services.bria.v1.UtxoDropped}
 */
proto.services.bria.v1.BriaEvent.prototype.getUtxoDropped = function() {
  return /** @type{?proto.services.bria.v1.UtxoDropped} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.UtxoDropped, 10));
};


/**
 * @param {?proto.services.bria.v1.UtxoDropped|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setUtxoDropped = function(value) {
  return jspb.Message.setOneofWrapperField(this, 10, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearUtxoDropped = function() {
  return this.setUtxoDropped(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasUtxoDropped = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional PayoutSubmitted payout_submitted = 6;
 * @return {?proto.services.bria.v1.PayoutSubmitted}
 */
proto.services.bria.v1.BriaEvent.prototype.getPayoutSubmitted = function() {
  return /** @type{?proto.services.bria.v1.PayoutSubmitted} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutSubmitted, 6));
};


/**
 * @param {?proto.services.bria.v1.PayoutSubmitted|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setPayoutSubmitted = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearPayoutSubmitted = function() {
  return this.setPayoutSubmitted(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasPayoutSubmitted = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional PayoutCancelled payout_cancelled = 11;
 * @return {?proto.services.bria.v1.PayoutCancelled}
 */
proto.services.bria.v1.BriaEvent.prototype.getPayoutCancelled = function() {
  return /** @type{?proto.services.bria.v1.PayoutCancelled} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutCancelled, 11));
};


/**
 * @param {?proto.services.bria.v1.PayoutCancelled|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setPayoutCancelled = function(value) {
  return jspb.Message.setOneofWrapperField(this, 11, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearPayoutCancelled = function() {
  return this.setPayoutCancelled(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasPayoutCancelled = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional PayoutCommitted payout_committed = 7;
 * @return {?proto.services.bria.v1.PayoutCommitted}
 */
proto.services.bria.v1.BriaEvent.prototype.getPayoutCommitted = function() {
  return /** @type{?proto.services.bria.v1.PayoutCommitted} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutCommitted, 7));
};


/**
 * @param {?proto.services.bria.v1.PayoutCommitted|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setPayoutCommitted = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearPayoutCommitted = function() {
  return this.setPayoutCommitted(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasPayoutCommitted = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional PayoutBroadcast payout_broadcast = 8;
 * @return {?proto.services.bria.v1.PayoutBroadcast}
 */
proto.services.bria.v1.BriaEvent.prototype.getPayoutBroadcast = function() {
  return /** @type{?proto.services.bria.v1.PayoutBroadcast} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutBroadcast, 8));
};


/**
 * @param {?proto.services.bria.v1.PayoutBroadcast|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setPayoutBroadcast = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearPayoutBroadcast = function() {
  return this.setPayoutBroadcast(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasPayoutBroadcast = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional PayoutSettled payout_settled = 9;
 * @return {?proto.services.bria.v1.PayoutSettled}
 */
proto.services.bria.v1.BriaEvent.prototype.getPayoutSettled = function() {
  return /** @type{?proto.services.bria.v1.PayoutSettled} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.PayoutSettled, 9));
};


/**
 * @param {?proto.services.bria.v1.PayoutSettled|undefined} value
 * @return {!proto.services.bria.v1.BriaEvent} returns this
*/
proto.services.bria.v1.BriaEvent.prototype.setPayoutSettled = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.services.bria.v1.BriaEvent.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.BriaEvent} returns this
 */
proto.services.bria.v1.BriaEvent.prototype.clearPayoutSettled = function() {
  return this.setPayoutSettled(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.BriaEvent.prototype.hasPayoutSettled = function() {
  return jspb.Message.getField(this, 9) != null;
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
proto.services.bria.v1.EventAugmentation.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.EventAugmentation.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.EventAugmentation} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.EventAugmentation.toObject = function(includeInstance, msg) {
  var f, obj = {
    addressInfo: (f = msg.getAddressInfo()) && proto.services.bria.v1.WalletAddress.toObject(includeInstance, f),
    payoutInfo: (f = msg.getPayoutInfo()) && proto.services.bria.v1.Payout.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.EventAugmentation}
 */
proto.services.bria.v1.EventAugmentation.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.EventAugmentation;
  return proto.services.bria.v1.EventAugmentation.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.EventAugmentation} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.EventAugmentation}
 */
proto.services.bria.v1.EventAugmentation.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.services.bria.v1.WalletAddress;
      reader.readMessage(value,proto.services.bria.v1.WalletAddress.deserializeBinaryFromReader);
      msg.setAddressInfo(value);
      break;
    case 2:
      var value = new proto.services.bria.v1.Payout;
      reader.readMessage(value,proto.services.bria.v1.Payout.deserializeBinaryFromReader);
      msg.setPayoutInfo(value);
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
proto.services.bria.v1.EventAugmentation.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.EventAugmentation.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.EventAugmentation} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.EventAugmentation.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAddressInfo();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.services.bria.v1.WalletAddress.serializeBinaryToWriter
    );
  }
  f = message.getPayoutInfo();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.services.bria.v1.Payout.serializeBinaryToWriter
    );
  }
};


/**
 * optional WalletAddress address_info = 1;
 * @return {?proto.services.bria.v1.WalletAddress}
 */
proto.services.bria.v1.EventAugmentation.prototype.getAddressInfo = function() {
  return /** @type{?proto.services.bria.v1.WalletAddress} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.WalletAddress, 1));
};


/**
 * @param {?proto.services.bria.v1.WalletAddress|undefined} value
 * @return {!proto.services.bria.v1.EventAugmentation} returns this
*/
proto.services.bria.v1.EventAugmentation.prototype.setAddressInfo = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.EventAugmentation} returns this
 */
proto.services.bria.v1.EventAugmentation.prototype.clearAddressInfo = function() {
  return this.setAddressInfo(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.EventAugmentation.prototype.hasAddressInfo = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Payout payout_info = 2;
 * @return {?proto.services.bria.v1.Payout}
 */
proto.services.bria.v1.EventAugmentation.prototype.getPayoutInfo = function() {
  return /** @type{?proto.services.bria.v1.Payout} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.Payout, 2));
};


/**
 * @param {?proto.services.bria.v1.Payout|undefined} value
 * @return {!proto.services.bria.v1.EventAugmentation} returns this
*/
proto.services.bria.v1.EventAugmentation.prototype.setPayoutInfo = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.EventAugmentation} returns this
 */
proto.services.bria.v1.EventAugmentation.prototype.clearPayoutInfo = function() {
  return this.setPayoutInfo(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.EventAugmentation.prototype.hasPayoutInfo = function() {
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
proto.services.bria.v1.UtxoDetected.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UtxoDetected.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UtxoDetected} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UtxoDetected.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    txId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    vout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    satoshis: jspb.Message.getFieldWithDefault(msg, 4, 0),
    address: jspb.Message.getFieldWithDefault(msg, 5, "")
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
 * @return {!proto.services.bria.v1.UtxoDetected}
 */
proto.services.bria.v1.UtxoDetected.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UtxoDetected;
  return proto.services.bria.v1.UtxoDetected.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UtxoDetected} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UtxoDetected}
 */
proto.services.bria.v1.UtxoDetected.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVout(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
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
proto.services.bria.v1.UtxoDetected.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UtxoDetected.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UtxoDetected} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UtxoDetected.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVout();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional string wallet_id = 1;
 * @return {string}
 */
proto.services.bria.v1.UtxoDetected.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoDetected} returns this
 */
proto.services.bria.v1.UtxoDetected.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string tx_id = 2;
 * @return {string}
 */
proto.services.bria.v1.UtxoDetected.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoDetected} returns this
 */
proto.services.bria.v1.UtxoDetected.prototype.setTxId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint32 vout = 3;
 * @return {number}
 */
proto.services.bria.v1.UtxoDetected.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoDetected} returns this
 */
proto.services.bria.v1.UtxoDetected.prototype.setVout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint64 satoshis = 4;
 * @return {number}
 */
proto.services.bria.v1.UtxoDetected.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoDetected} returns this
 */
proto.services.bria.v1.UtxoDetected.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string address = 5;
 * @return {string}
 */
proto.services.bria.v1.UtxoDetected.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoDetected} returns this
 */
proto.services.bria.v1.UtxoDetected.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
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
proto.services.bria.v1.UtxoSettled.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UtxoSettled.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UtxoSettled} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UtxoSettled.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    txId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    vout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    satoshis: jspb.Message.getFieldWithDefault(msg, 4, 0),
    address: jspb.Message.getFieldWithDefault(msg, 5, ""),
    blockHeight: jspb.Message.getFieldWithDefault(msg, 6, 0),
    blockTime: jspb.Message.getFieldWithDefault(msg, 7, 0)
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
 * @return {!proto.services.bria.v1.UtxoSettled}
 */
proto.services.bria.v1.UtxoSettled.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UtxoSettled;
  return proto.services.bria.v1.UtxoSettled.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UtxoSettled} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UtxoSettled}
 */
proto.services.bria.v1.UtxoSettled.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVout(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setBlockHeight(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setBlockTime(value);
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
proto.services.bria.v1.UtxoSettled.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UtxoSettled.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UtxoSettled} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UtxoSettled.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVout();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getBlockHeight();
  if (f !== 0) {
    writer.writeUint32(
      6,
      f
    );
  }
  f = message.getBlockTime();
  if (f !== 0) {
    writer.writeUint64(
      7,
      f
    );
  }
};


/**
 * optional string wallet_id = 1;
 * @return {string}
 */
proto.services.bria.v1.UtxoSettled.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoSettled} returns this
 */
proto.services.bria.v1.UtxoSettled.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string tx_id = 2;
 * @return {string}
 */
proto.services.bria.v1.UtxoSettled.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoSettled} returns this
 */
proto.services.bria.v1.UtxoSettled.prototype.setTxId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint32 vout = 3;
 * @return {number}
 */
proto.services.bria.v1.UtxoSettled.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoSettled} returns this
 */
proto.services.bria.v1.UtxoSettled.prototype.setVout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint64 satoshis = 4;
 * @return {number}
 */
proto.services.bria.v1.UtxoSettled.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoSettled} returns this
 */
proto.services.bria.v1.UtxoSettled.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string address = 5;
 * @return {string}
 */
proto.services.bria.v1.UtxoSettled.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoSettled} returns this
 */
proto.services.bria.v1.UtxoSettled.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional uint32 block_height = 6;
 * @return {number}
 */
proto.services.bria.v1.UtxoSettled.prototype.getBlockHeight = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoSettled} returns this
 */
proto.services.bria.v1.UtxoSettled.prototype.setBlockHeight = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional uint64 block_time = 7;
 * @return {number}
 */
proto.services.bria.v1.UtxoSettled.prototype.getBlockTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoSettled} returns this
 */
proto.services.bria.v1.UtxoSettled.prototype.setBlockTime = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
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
proto.services.bria.v1.UtxoDropped.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.UtxoDropped.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.UtxoDropped} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UtxoDropped.toObject = function(includeInstance, msg) {
  var f, obj = {
    walletId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    txId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    vout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    satoshis: jspb.Message.getFieldWithDefault(msg, 4, 0),
    address: jspb.Message.getFieldWithDefault(msg, 5, "")
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
 * @return {!proto.services.bria.v1.UtxoDropped}
 */
proto.services.bria.v1.UtxoDropped.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.UtxoDropped;
  return proto.services.bria.v1.UtxoDropped.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.UtxoDropped} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.UtxoDropped}
 */
proto.services.bria.v1.UtxoDropped.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVout(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setAddress(value);
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
proto.services.bria.v1.UtxoDropped.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.UtxoDropped.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.UtxoDropped} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.UtxoDropped.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVout();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = message.getAddress();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional string wallet_id = 1;
 * @return {string}
 */
proto.services.bria.v1.UtxoDropped.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoDropped} returns this
 */
proto.services.bria.v1.UtxoDropped.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string tx_id = 2;
 * @return {string}
 */
proto.services.bria.v1.UtxoDropped.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoDropped} returns this
 */
proto.services.bria.v1.UtxoDropped.prototype.setTxId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint32 vout = 3;
 * @return {number}
 */
proto.services.bria.v1.UtxoDropped.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoDropped} returns this
 */
proto.services.bria.v1.UtxoDropped.prototype.setVout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional uint64 satoshis = 4;
 * @return {number}
 */
proto.services.bria.v1.UtxoDropped.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.UtxoDropped} returns this
 */
proto.services.bria.v1.UtxoDropped.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string address = 5;
 * @return {string}
 */
proto.services.bria.v1.UtxoDropped.prototype.getAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.UtxoDropped} returns this
 */
proto.services.bria.v1.UtxoDropped.prototype.setAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.PayoutSubmitted.oneofGroups_ = [[5,6]];

/**
 * @enum {number}
 */
proto.services.bria.v1.PayoutSubmitted.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 5,
  WALLET: 6
};

/**
 * @return {proto.services.bria.v1.PayoutSubmitted.DestinationCase}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.PayoutSubmitted.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.PayoutSubmitted.oneofGroups_[0]));
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
proto.services.bria.v1.PayoutSubmitted.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutSubmitted.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutSubmitted} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutSubmitted.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    walletId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    payoutQueueId: jspb.Message.getFieldWithDefault(msg, 3, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 4, 0),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 5, ""),
    wallet: (f = msg.getWallet()) && proto.services.bria.v1.BriaWalletDestination.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.PayoutSubmitted}
 */
proto.services.bria.v1.PayoutSubmitted.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutSubmitted;
  return proto.services.bria.v1.PayoutSubmitted.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutSubmitted} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutSubmitted}
 */
proto.services.bria.v1.PayoutSubmitted.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueId(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 6:
      var value = new proto.services.bria.v1.BriaWalletDestination;
      reader.readMessage(value,proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader);
      msg.setWallet(value);
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
proto.services.bria.v1.PayoutSubmitted.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutSubmitted.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutSubmitted} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutSubmitted.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getPayoutQueueId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getWallet();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
 */
proto.services.bria.v1.PayoutSubmitted.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string wallet_id = 2;
 * @return {string}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
 */
proto.services.bria.v1.PayoutSubmitted.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string payout_queue_id = 3;
 * @return {string}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.getPayoutQueueId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
 */
proto.services.bria.v1.PayoutSubmitted.prototype.setPayoutQueueId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional uint64 satoshis = 4;
 * @return {number}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
 */
proto.services.bria.v1.PayoutSubmitted.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string onchain_address = 5;
 * @return {string}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
 */
proto.services.bria.v1.PayoutSubmitted.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.PayoutSubmitted.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
 */
proto.services.bria.v1.PayoutSubmitted.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.PayoutSubmitted.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional BriaWalletDestination wallet = 6;
 * @return {?proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.getWallet = function() {
  return /** @type{?proto.services.bria.v1.BriaWalletDestination} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BriaWalletDestination, 6));
};


/**
 * @param {?proto.services.bria.v1.BriaWalletDestination|undefined} value
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
*/
proto.services.bria.v1.PayoutSubmitted.prototype.setWallet = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.services.bria.v1.PayoutSubmitted.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.PayoutSubmitted} returns this
 */
proto.services.bria.v1.PayoutSubmitted.prototype.clearWallet = function() {
  return this.setWallet(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutSubmitted.prototype.hasWallet = function() {
  return jspb.Message.getField(this, 6) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.PayoutCancelled.oneofGroups_ = [[5,6]];

/**
 * @enum {number}
 */
proto.services.bria.v1.PayoutCancelled.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 5,
  WALLET: 6
};

/**
 * @return {proto.services.bria.v1.PayoutCancelled.DestinationCase}
 */
proto.services.bria.v1.PayoutCancelled.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.PayoutCancelled.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.PayoutCancelled.oneofGroups_[0]));
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
proto.services.bria.v1.PayoutCancelled.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutCancelled.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutCancelled} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutCancelled.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    walletId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    payoutQueueId: jspb.Message.getFieldWithDefault(msg, 3, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 4, 0),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 5, ""),
    wallet: (f = msg.getWallet()) && proto.services.bria.v1.BriaWalletDestination.toObject(includeInstance, f)
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
 * @return {!proto.services.bria.v1.PayoutCancelled}
 */
proto.services.bria.v1.PayoutCancelled.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutCancelled;
  return proto.services.bria.v1.PayoutCancelled.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutCancelled} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutCancelled}
 */
proto.services.bria.v1.PayoutCancelled.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueId(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 6:
      var value = new proto.services.bria.v1.BriaWalletDestination;
      reader.readMessage(value,proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader);
      msg.setWallet(value);
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
proto.services.bria.v1.PayoutCancelled.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutCancelled.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutCancelled} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutCancelled.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getPayoutQueueId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      4,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getWallet();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.PayoutCancelled.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
 */
proto.services.bria.v1.PayoutCancelled.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string wallet_id = 2;
 * @return {string}
 */
proto.services.bria.v1.PayoutCancelled.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
 */
proto.services.bria.v1.PayoutCancelled.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string payout_queue_id = 3;
 * @return {string}
 */
proto.services.bria.v1.PayoutCancelled.prototype.getPayoutQueueId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
 */
proto.services.bria.v1.PayoutCancelled.prototype.setPayoutQueueId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional uint64 satoshis = 4;
 * @return {number}
 */
proto.services.bria.v1.PayoutCancelled.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
 */
proto.services.bria.v1.PayoutCancelled.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string onchain_address = 5;
 * @return {string}
 */
proto.services.bria.v1.PayoutCancelled.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
 */
proto.services.bria.v1.PayoutCancelled.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.PayoutCancelled.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
 */
proto.services.bria.v1.PayoutCancelled.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 5, proto.services.bria.v1.PayoutCancelled.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutCancelled.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional BriaWalletDestination wallet = 6;
 * @return {?proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.PayoutCancelled.prototype.getWallet = function() {
  return /** @type{?proto.services.bria.v1.BriaWalletDestination} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BriaWalletDestination, 6));
};


/**
 * @param {?proto.services.bria.v1.BriaWalletDestination|undefined} value
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
*/
proto.services.bria.v1.PayoutCancelled.prototype.setWallet = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.services.bria.v1.PayoutCancelled.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.PayoutCancelled} returns this
 */
proto.services.bria.v1.PayoutCancelled.prototype.clearWallet = function() {
  return this.setWallet(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutCancelled.prototype.hasWallet = function() {
  return jspb.Message.getField(this, 6) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.PayoutCommitted.oneofGroups_ = [[7,9]];

/**
 * @enum {number}
 */
proto.services.bria.v1.PayoutCommitted.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 7,
  WALLET: 9
};

/**
 * @return {proto.services.bria.v1.PayoutCommitted.DestinationCase}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.PayoutCommitted.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.PayoutCommitted.oneofGroups_[0]));
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
proto.services.bria.v1.PayoutCommitted.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutCommitted.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutCommitted} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutCommitted.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    txId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    vout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    walletId: jspb.Message.getFieldWithDefault(msg, 4, ""),
    payoutQueueId: jspb.Message.getFieldWithDefault(msg, 5, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 6, 0),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 7, ""),
    wallet: (f = msg.getWallet()) && proto.services.bria.v1.BriaWalletDestination.toObject(includeInstance, f),
    proportionalFeeSats: jspb.Message.getFieldWithDefault(msg, 8, 0)
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
 * @return {!proto.services.bria.v1.PayoutCommitted}
 */
proto.services.bria.v1.PayoutCommitted.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutCommitted;
  return proto.services.bria.v1.PayoutCommitted.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutCommitted} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutCommitted}
 */
proto.services.bria.v1.PayoutCommitted.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVout(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueId(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 9:
      var value = new proto.services.bria.v1.BriaWalletDestination;
      reader.readMessage(value,proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader);
      msg.setWallet(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setProportionalFeeSats(value);
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
proto.services.bria.v1.PayoutCommitted.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutCommitted.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutCommitted} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutCommitted.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVout();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getPayoutQueueId();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      6,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getWallet();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter
    );
  }
  f = message.getProportionalFeeSats();
  if (f !== 0) {
    writer.writeUint64(
      8,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string tx_id = 2;
 * @return {string}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setTxId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint32 vout = 3;
 * @return {number}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setVout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string wallet_id = 4;
 * @return {string}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string payout_queue_id = 5;
 * @return {string}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getPayoutQueueId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setPayoutQueueId = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional uint64 satoshis = 6;
 * @return {number}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string onchain_address = 7;
 * @return {string}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.PayoutCommitted.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.PayoutCommitted.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutCommitted.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional BriaWalletDestination wallet = 9;
 * @return {?proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getWallet = function() {
  return /** @type{?proto.services.bria.v1.BriaWalletDestination} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BriaWalletDestination, 9));
};


/**
 * @param {?proto.services.bria.v1.BriaWalletDestination|undefined} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
*/
proto.services.bria.v1.PayoutCommitted.prototype.setWallet = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.services.bria.v1.PayoutCommitted.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.clearWallet = function() {
  return this.setWallet(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutCommitted.prototype.hasWallet = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional uint64 proportional_fee_sats = 8;
 * @return {number}
 */
proto.services.bria.v1.PayoutCommitted.prototype.getProportionalFeeSats = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutCommitted} returns this
 */
proto.services.bria.v1.PayoutCommitted.prototype.setProportionalFeeSats = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.PayoutBroadcast.oneofGroups_ = [[7,9]];

/**
 * @enum {number}
 */
proto.services.bria.v1.PayoutBroadcast.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 7,
  WALLET: 9
};

/**
 * @return {proto.services.bria.v1.PayoutBroadcast.DestinationCase}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.PayoutBroadcast.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.PayoutBroadcast.oneofGroups_[0]));
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
proto.services.bria.v1.PayoutBroadcast.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutBroadcast.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutBroadcast} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutBroadcast.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    txId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    vout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    walletId: jspb.Message.getFieldWithDefault(msg, 4, ""),
    payoutQueueId: jspb.Message.getFieldWithDefault(msg, 5, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 6, 0),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 7, ""),
    wallet: (f = msg.getWallet()) && proto.services.bria.v1.BriaWalletDestination.toObject(includeInstance, f),
    proportionalFeeSats: jspb.Message.getFieldWithDefault(msg, 8, 0)
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
 * @return {!proto.services.bria.v1.PayoutBroadcast}
 */
proto.services.bria.v1.PayoutBroadcast.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutBroadcast;
  return proto.services.bria.v1.PayoutBroadcast.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutBroadcast} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutBroadcast}
 */
proto.services.bria.v1.PayoutBroadcast.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVout(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueId(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 9:
      var value = new proto.services.bria.v1.BriaWalletDestination;
      reader.readMessage(value,proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader);
      msg.setWallet(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setProportionalFeeSats(value);
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
proto.services.bria.v1.PayoutBroadcast.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutBroadcast.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutBroadcast} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutBroadcast.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVout();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getPayoutQueueId();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      6,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getWallet();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter
    );
  }
  f = message.getProportionalFeeSats();
  if (f !== 0) {
    writer.writeUint64(
      8,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string tx_id = 2;
 * @return {string}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setTxId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint32 vout = 3;
 * @return {number}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setVout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string wallet_id = 4;
 * @return {string}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string payout_queue_id = 5;
 * @return {string}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getPayoutQueueId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setPayoutQueueId = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional uint64 satoshis = 6;
 * @return {number}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string onchain_address = 7;
 * @return {string}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.PayoutBroadcast.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.PayoutBroadcast.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional BriaWalletDestination wallet = 9;
 * @return {?proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getWallet = function() {
  return /** @type{?proto.services.bria.v1.BriaWalletDestination} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BriaWalletDestination, 9));
};


/**
 * @param {?proto.services.bria.v1.BriaWalletDestination|undefined} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
*/
proto.services.bria.v1.PayoutBroadcast.prototype.setWallet = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.services.bria.v1.PayoutBroadcast.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.clearWallet = function() {
  return this.setWallet(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.hasWallet = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional uint64 proportional_fee_sats = 8;
 * @return {number}
 */
proto.services.bria.v1.PayoutBroadcast.prototype.getProportionalFeeSats = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutBroadcast} returns this
 */
proto.services.bria.v1.PayoutBroadcast.prototype.setProportionalFeeSats = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.services.bria.v1.PayoutSettled.oneofGroups_ = [[7,9]];

/**
 * @enum {number}
 */
proto.services.bria.v1.PayoutSettled.DestinationCase = {
  DESTINATION_NOT_SET: 0,
  ONCHAIN_ADDRESS: 7,
  WALLET: 9
};

/**
 * @return {proto.services.bria.v1.PayoutSettled.DestinationCase}
 */
proto.services.bria.v1.PayoutSettled.prototype.getDestinationCase = function() {
  return /** @type {proto.services.bria.v1.PayoutSettled.DestinationCase} */(jspb.Message.computeOneofCase(this, proto.services.bria.v1.PayoutSettled.oneofGroups_[0]));
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
proto.services.bria.v1.PayoutSettled.prototype.toObject = function(opt_includeInstance) {
  return proto.services.bria.v1.PayoutSettled.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.services.bria.v1.PayoutSettled} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutSettled.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    txId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    vout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    walletId: jspb.Message.getFieldWithDefault(msg, 4, ""),
    payoutQueueId: jspb.Message.getFieldWithDefault(msg, 5, ""),
    satoshis: jspb.Message.getFieldWithDefault(msg, 6, 0),
    onchainAddress: jspb.Message.getFieldWithDefault(msg, 7, ""),
    wallet: (f = msg.getWallet()) && proto.services.bria.v1.BriaWalletDestination.toObject(includeInstance, f),
    proportionalFeeSats: jspb.Message.getFieldWithDefault(msg, 8, 0)
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
 * @return {!proto.services.bria.v1.PayoutSettled}
 */
proto.services.bria.v1.PayoutSettled.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.services.bria.v1.PayoutSettled;
  return proto.services.bria.v1.PayoutSettled.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.services.bria.v1.PayoutSettled} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.services.bria.v1.PayoutSettled}
 */
proto.services.bria.v1.PayoutSettled.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTxId(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readUint32());
      msg.setVout(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setWalletId(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setPayoutQueueId(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setSatoshis(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setOnchainAddress(value);
      break;
    case 9:
      var value = new proto.services.bria.v1.BriaWalletDestination;
      reader.readMessage(value,proto.services.bria.v1.BriaWalletDestination.deserializeBinaryFromReader);
      msg.setWallet(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readUint64());
      msg.setProportionalFeeSats(value);
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
proto.services.bria.v1.PayoutSettled.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.services.bria.v1.PayoutSettled.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.services.bria.v1.PayoutSettled} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.services.bria.v1.PayoutSettled.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTxId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVout();
  if (f !== 0) {
    writer.writeUint32(
      3,
      f
    );
  }
  f = message.getWalletId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getPayoutQueueId();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getSatoshis();
  if (f !== 0) {
    writer.writeUint64(
      6,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getWallet();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.services.bria.v1.BriaWalletDestination.serializeBinaryToWriter
    );
  }
  f = message.getProportionalFeeSats();
  if (f !== 0) {
    writer.writeUint64(
      8,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.services.bria.v1.PayoutSettled.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string tx_id = 2;
 * @return {string}
 */
proto.services.bria.v1.PayoutSettled.prototype.getTxId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setTxId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional uint32 vout = 3;
 * @return {number}
 */
proto.services.bria.v1.PayoutSettled.prototype.getVout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setVout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string wallet_id = 4;
 * @return {string}
 */
proto.services.bria.v1.PayoutSettled.prototype.getWalletId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setWalletId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string payout_queue_id = 5;
 * @return {string}
 */
proto.services.bria.v1.PayoutSettled.prototype.getPayoutQueueId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setPayoutQueueId = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional uint64 satoshis = 6;
 * @return {number}
 */
proto.services.bria.v1.PayoutSettled.prototype.getSatoshis = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setSatoshis = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string onchain_address = 7;
 * @return {string}
 */
proto.services.bria.v1.PayoutSettled.prototype.getOnchainAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setOnchainAddress = function(value) {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.PayoutSettled.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.clearOnchainAddress = function() {
  return jspb.Message.setOneofField(this, 7, proto.services.bria.v1.PayoutSettled.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutSettled.prototype.hasOnchainAddress = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional BriaWalletDestination wallet = 9;
 * @return {?proto.services.bria.v1.BriaWalletDestination}
 */
proto.services.bria.v1.PayoutSettled.prototype.getWallet = function() {
  return /** @type{?proto.services.bria.v1.BriaWalletDestination} */ (
    jspb.Message.getWrapperField(this, proto.services.bria.v1.BriaWalletDestination, 9));
};


/**
 * @param {?proto.services.bria.v1.BriaWalletDestination|undefined} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
*/
proto.services.bria.v1.PayoutSettled.prototype.setWallet = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.services.bria.v1.PayoutSettled.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.clearWallet = function() {
  return this.setWallet(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.services.bria.v1.PayoutSettled.prototype.hasWallet = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional uint64 proportional_fee_sats = 8;
 * @return {number}
 */
proto.services.bria.v1.PayoutSettled.prototype.getProportionalFeeSats = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.services.bria.v1.PayoutSettled} returns this
 */
proto.services.bria.v1.PayoutSettled.prototype.setProportionalFeeSats = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * @enum {number}
 */
proto.services.bria.v1.KeychainKind = {
  INTERNAL: 0,
  EXTERNAL: 1
};

/**
 * @enum {number}
 */
proto.services.bria.v1.TxPriority = {
  NEXT_BLOCK: 0,
  HALF_HOUR: 1,
  ONE_HOUR: 2
};

goog.object.extend(exports, proto.services.bria.v1);
