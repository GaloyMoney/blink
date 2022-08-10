import { GT } from "@graphql/index"
import { parseCustomFieldsInputSchema } from "@graphql/helpers"

import { customFieldsInputInfo } from "./custom-fields-input-info"

jest.mock("@services/redis", () => ({}))

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  const getLndParams = (): LndParams[] => []
  return { ...config, getLndParams }
})

describe("parseCustomFieldsInputSchema", () => {
  it("returns empty fields with an empty schema", () => {
    const result = parseCustomFieldsInputSchema({ fields: [] })
    expect(result).toEqual({})
  })

  it("returns empty with onlyEditable for non editable schema", () => {
    const customEditableFields = customFieldsInputInfo.filter((s) => !s.schema.editable)
    const schema = customEditableFields.map((s) => s.schema)
    const result = parseCustomFieldsInputSchema({ fields: schema, onlyEditable: true })
    expect(result).toEqual({})
  })

  it("returns default type as string", () => {
    const info = { name: "fieldName" }
    const result = parseCustomFieldsInputSchema({ fields: [info] })
    expect(result).toEqual(expect.objectContaining({ fieldName: { type: GT.String } }))
  })

  test.each(customFieldsInputInfo.filter((s) => s.schema.required && !s.schema.array))(
    "returns non-null $schema.type schema field",
    ({ schema, field }) => {
      const result = parseCustomFieldsInputSchema({ fields: [schema] })
      expect(result).toEqual(expect.objectContaining(field))
    },
  )

  test.each(customFieldsInputInfo.filter((s) => !s.schema.required && !s.schema.array))(
    "returns null $schema.type schema field",
    ({ schema, field }) => {
      const result = parseCustomFieldsInputSchema({ fields: [schema] })
      expect(result).toEqual(expect.objectContaining(field))
    },
  )

  test.each(customFieldsInputInfo.filter((s) => s.schema.required && s.schema.array))(
    "returns non-null $schema.type array schema field",
    ({ schema, field }) => {
      const result = parseCustomFieldsInputSchema({ fields: [schema] })
      expect(result).toEqual(expect.objectContaining(field))
    },
  )

  test.each(customFieldsInputInfo.filter((s) => !s.schema.required && s.schema.array))(
    "returns null $schema.type array schema field",
    ({ schema, field }) => {
      const result = parseCustomFieldsInputSchema({ fields: [schema] })
      expect(result).toEqual(expect.objectContaining(field))
    },
  )

  test.each(
    customFieldsInputInfo.filter(
      (s) => s.schema.defaultValue !== undefined && !s.schema.array,
    ),
  )("returns default values for $schema.type", ({ schema, field }) => {
    const result = parseCustomFieldsInputSchema({ fields: [schema] })
    expect(result).toEqual(expect.objectContaining(field))
    expect(result[schema.name].defaultValue).toBe(field[schema.name].defaultValue)
  })

  test.each(
    customFieldsInputInfo.filter(
      (s) => s.schema.defaultValue !== undefined && s.schema.array,
    ),
  )("returns default values for $schema.type array", ({ schema, field }) => {
    const result = parseCustomFieldsInputSchema({ fields: [schema] })
    expect(result).toEqual(expect.objectContaining(field))
    expect(result[schema.name].defaultValue.length).toBeGreaterThan(0)
    expect(result[schema.name].defaultValue).toStrictEqual(
      field[schema.name].defaultValue,
    )
  })

  it("returns multiple fields", () => {
    const schema = customFieldsInputInfo.map((s) => s.schema)
    const fields = Object.assign({}, ...customFieldsInputInfo.map((s) => s.field))
    const result = parseCustomFieldsInputSchema({ fields: schema })
    expect(Object.keys(result as object).length).toEqual(Object.keys(fields).length)
    expect(result).toEqual(expect.objectContaining(fields))
  })

  it("returns multiple editable fields", () => {
    const customEditableFields = customFieldsInputInfo.filter((s) => !!s.schema.editable)
    const schema = customFieldsInputInfo.map((s) => s.schema)
    const fields = Object.assign({}, ...customEditableFields.map((s) => s.field))
    const result = parseCustomFieldsInputSchema({ fields: schema, onlyEditable: true })
    expect(Object.keys(result as object).length).toEqual(Object.keys(fields).length)
    expect(result).toEqual(expect.objectContaining(fields))
  })

  it("removes duplicated fields", () => {
    const schema = customFieldsInputInfo.map((s) => s.schema)
    const fields = Object.assign({}, ...customFieldsInputInfo.map((s) => s.field))
    const result = parseCustomFieldsInputSchema({
      fields: [...schema, ...schema.slice()],
    })
    expect(Object.keys(result as object).length).toEqual(Object.keys(fields).length)
    expect(result).toEqual(expect.objectContaining(fields))
  })
})
