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
  {
    schema: {
      name: "fieldNameDefaultNonNullStringArray",
      type: "string",
      array: true,
      required: true,
      defaultValue: ["default"],
    } as CustomField,
    field: {
      fieldNameDefaultNonNullStringArray: {
        type: GT.NonNullList(GT.String),
        defaultValue: ["default"],
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultStringArray",
      type: "string",
      array: true,
      required: false,
      defaultValue: ["default"],
    } as CustomField,
    field: {
      fieldNameDefaultStringArray: {
        type: GT.List(GT.String),
        defaultValue: ["default"],
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultNonNullIntArray",
      type: "integer",
      array: true,
      required: true,
      defaultValue: [21, 2016],
    } as CustomField,
    field: {
      fieldNameDefaultNonNullIntArray: {
        type: GT.NonNullList(GT.Int),
        defaultValue: [21, 2016],
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultIntArray",
      type: "integer",
      array: true,
      required: false,
      defaultValue: [21, 2016],
    } as CustomField,
    field: {
      fieldNameDefaultIntArray: { type: GT.List(GT.Int), defaultValue: [21, 2016] },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultNonNullFloatArray",
      type: "float",
      array: true,
      required: true,
      defaultValue: [21.21, 2016.0],
    } as CustomField,
    field: {
      fieldNameDefaultNonNullFloatArray: {
        type: GT.NonNullList(GT.Float),
        defaultValue: [21.21, 2016.0],
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultFloatArray",
      type: "float",
      array: true,
      required: false,
      defaultValue: [21.21, 2016.0],
    } as CustomField,
    field: {
      fieldNameDefaultFloatArray: {
        type: GT.List(GT.Float),
        defaultValue: [21.21, 2016.0],
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultNonNullBooleanArray",
      type: "boolean",
      array: true,
      required: true,
      defaultValue: [false, true],
    } as CustomField,
    field: {
      fieldNameDefaultNonNullBooleanArray: {
        type: GT.NonNullList(GT.Boolean),
        defaultValue: [false, true],
      },
    },
  },
  {
    schema: {
      name: "fieldNameDefaultBooleanArray",
      type: "boolean",
      array: true,
      required: false,
      defaultValue: [false, true],
    } as CustomField,
    field: {
      fieldNameDefaultBooleanArray: {
        type: GT.List(GT.Boolean),
        defaultValue: [false, true],
      },
    },
  },
]
