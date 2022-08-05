import { GT } from "@graphql/index"

export const customFieldsInfo = [
  {
    schema: {
      name: "fieldNameNonNullString",
      type: "string",
      required: true,
    } as CustomField,
    field: { fieldNameNonNullString: { type: GT.NonNull(GT.String) } },
  },
  {
    schema: { name: "fieldNameString", type: "string", required: false } as CustomField,
    field: { fieldNameString: { type: GT.String } },
  },
  {
    schema: {
      name: "fieldNameEditableString",
      type: "string",
      editable: true,
    } as CustomField,
    field: { fieldNameEditableString: { type: GT.String } },
  },
  {
    schema: {
      name: "fieldNameNonNullInt",
      type: "integer",
      required: true,
    } as CustomField,
    field: { fieldNameNonNullInt: { type: GT.NonNull(GT.Int) } },
  },
  {
    schema: { name: "fieldNameInt", type: "integer", required: false } as CustomField,
    field: { fieldNameInt: { type: GT.Int } },
  },
  {
    schema: {
      name: "fieldNameEditableInt",
      type: "integer",
      editable: true,
    } as CustomField,
    field: { fieldNameEditableInt: { type: GT.Int } },
  },
  {
    schema: {
      name: "fieldNameNonNullFloat",
      type: "float",
      required: true,
    } as CustomField,
    field: { fieldNameNonNullFloat: { type: GT.NonNull(GT.Float) } },
  },
  {
    schema: { name: "fieldNameFloat", type: "float", required: false } as CustomField,
    field: { fieldNameFloat: { type: GT.Float } },
  },
  {
    schema: {
      name: "fieldNameEditableFloat",
      type: "float",
      editable: true,
    } as CustomField,
    field: { fieldNameEditableFloat: { type: GT.Float } },
  },
  {
    schema: {
      name: "fieldNameNonNullBoolean",
      type: "boolean",
      required: true,
    } as CustomField,
    field: { fieldNameNonNullBoolean: { type: GT.NonNull(GT.Boolean) } },
  },
  {
    schema: { name: "fieldNameBoolean", type: "boolean", required: false } as CustomField,
    field: { fieldNameBoolean: { type: GT.Boolean } },
  },
  {
    schema: {
      name: "fieldNameEditableBoolean",
      type: "boolean",
      editable: true,
    } as CustomField,
    field: { fieldNameEditableBoolean: { type: GT.Boolean } },
  },
  {
    schema: {
      name: "fieldNameNonNullStringArray",
      type: "string",
      array: true,
      required: true,
    } as CustomField,
    field: { fieldNameNonNullStringArray: { type: GT.NonNullList(GT.String) } },
  },
  {
    schema: {
      name: "fieldNameStringArray",
      type: "string",
      array: true,
      required: false,
    } as CustomField,
    field: { fieldNameStringArray: { type: GT.List(GT.String) } },
  },
  {
    schema: {
      name: "fieldNameEditableStringArray",
      type: "string",
      array: true,
      editable: true,
    } as CustomField,
    field: { fieldNameEditableStringArray: { type: GT.List(GT.String) } },
  },
  {
    schema: {
      name: "fieldNameNonNullIntArray",
      type: "integer",
      array: true,
      required: true,
    } as CustomField,
    field: { fieldNameNonNullIntArray: { type: GT.NonNullList(GT.Int) } },
  },
  {
    schema: {
      name: "fieldNameIntArray",
      type: "integer",
      array: true,
      required: false,
    } as CustomField,
    field: { fieldNameIntArray: { type: GT.List(GT.Int) } },
  },
  {
    schema: {
      name: "fieldNameEditableIntArray",
      type: "integer",
      array: true,
      editable: true,
    } as CustomField,
    field: { fieldNameEditableIntArray: { type: GT.List(GT.Int) } },
  },
  {
    schema: {
      name: "fieldNameNonNullFloatArray",
      type: "float",
      array: true,
      required: true,
    } as CustomField,
    field: { fieldNameNonNullFloatArray: { type: GT.NonNullList(GT.Float) } },
  },
  {
    schema: {
      name: "fieldNameFloatArray",
      type: "float",
      array: true,
      required: false,
    } as CustomField,
    field: { fieldNameFloatArray: { type: GT.List(GT.Float) } },
  },
  {
    schema: {
      name: "fieldNameEditableFloatArray",
      type: "float",
      array: true,
      editable: true,
    } as CustomField,
    field: { fieldNameEditableFloatArray: { type: GT.List(GT.Float) } },
  },
  {
    schema: {
      name: "fieldNameNonNullBooleanArray",
      type: "boolean",
      array: true,
      required: true,
    } as CustomField,
    field: { fieldNameNonNullBooleanArray: { type: GT.NonNullList(GT.Boolean) } },
  },
  {
    schema: {
      name: "fieldNameBooleanArray",
      type: "boolean",
      array: true,
      required: false,
    } as CustomField,
    field: { fieldNameBooleanArray: { type: GT.List(GT.Boolean) } },
  },
  {
    schema: {
      name: "fieldNameEditableBooleanArray",
      type: "boolean",
      array: true,
      editable: true,
    } as CustomField,
    field: { fieldNameEditableBooleanArray: { type: GT.List(GT.Boolean) } },
  },
]
