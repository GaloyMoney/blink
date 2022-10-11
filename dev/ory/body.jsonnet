function(ctx) {
    identity_id: if std.objectHas(ctx, "identity") then ctx.identity.id else null,
    flow_id: ctx.flow.id,
    flow_type: ctx.flow.type
}
