function(ctx) {
    identity_id: if std.objectHas(ctx, "identity") then ctx.identity.id else null,
    phone: if std.objectHas(ctx.identity.traits, "phone") then ctx.identity.traits.phone else null,
    deviceId: if std.objectHas(ctx.identity.traits, "deviceId") then ctx.identity.traits.deviceId else null,
    schema_id: ctx.identity.schema_id,
    flow_id: ctx.flow.id,
    flow_type: ctx.flow.type
}
