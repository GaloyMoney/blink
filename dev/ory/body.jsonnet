function(ctx) {
    identity_id: if std.objectHas(ctx, "identity") then ctx.identity.id else null,
    phone: ctx.identity.traits.phone,
    schema_id: ctx.identity.schema_id,
    flow_id: ctx.flow.id,
    flow_type: ctx.flow.type
}
