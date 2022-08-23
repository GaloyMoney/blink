import { GT } from "@graphql/index"

import { customFieldsInfo } from "./custom-fields-info"

export const customFieldsInputInfo = [
  ...customFieldsInfo,
  {
    schema: {
      name: "fieldNameDefaultNonNullString",
      type: "string",
      required: true,
      defaultValue: "default",
    } as CustomField,
    field: {
      fieldNameDefaultNonNullString: {
        type: GT.NonNull(GT.String),
        defaultValue: "default",
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultString",
      type: "string",
      required: false,
      defaultValue: "default",
    } as CustomField,
    field: { fieldNameDefaultString: { type: GT.String, defaultValue: "default" } },
  },
  {
    schema: {
      name: "fieldNameDefaultNonNullInt",
      type: "integer",
      required: true,
      defaultValue: 21,
    } as CustomField,
    field: { fieldNameDefaultNonNullInt: { type: GT.NonNull(GT.Int), defaultValue: 21 } },
  },
  {
    schema: {
      name: "fieldNameDefaultInt",
      type: "integer",
      required: false,
      defaultValue: 21,
    } as CustomField,
    field: { fieldNameDefaultInt: { type: GT.Int, defaultValue: 21 } },
  },
  {
    schema: {
      name: "fieldNameDefaultNonNullFloat",
      type: "float",
      required: true,
      defaultValue: 21.21,
    } as CustomField,
    field: {
      fieldNameDefaultNonNullFloat: { type: GT.NonNull(GT.Float), defaultValue: 21.21 },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultFloat",
      type: "float",
      required: false,
      defaultValue: 21.21,
    } as CustomField,
    field: { fieldNameDefaultFloat: { type: GT.Float, defaultValue: 21.21 } },
  },
  {
    schema: {
      name: "fieldNameDefaultNonNullBoolean",
      type: "boolean",
      required: true,
      defaultValue: true,
    } as CustomField,
    field: {
      fieldNameDefaultNonNullBoolean: {
        type: GT.NonNull(GT.Boolean),
        defaultValue: true,
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultBoolean",
      type: "boolean",
      required: false,
      defaultValue: true,
    } as CustomField,
    field: { fieldNameDefaultBoolean: { type: GT.Boolean, defaultValue: true } },
  },
]
