import { MongoServerError } from 'mongodb'
import { describe, expectTypeOf, it } from 'vite-plus/test'
import {
  extractValidationErrors,
  isMongoServerError,
  type DocumentValidationError,
  type MongoValidationError,
  type ValidationDetail,
  type ValidationErrors,
  type ValidationProperty,
} from '../src/mongo-validation-error.js'

const documentValidationError = {
  failingDocumentId: '507f1f77bcf86cd799439011',
  details: {
    operatorName: '$jsonSchema',
    schemaRulesNotSatisfied: [
      {
        operatorName: 'properties',
        propertiesNotSatisfied: [
          {
            propertyName: 'name',
            details: [
              {
                operatorName: 'maxLength',
                specifiedAs: { maxLength: 20 },
                reason: 'specified string length was not satisfied',
                consideredValue: 'very long name',
                consideredType: 'string',
              },
            ],
          },
        ],
      },
    ],
  },
} satisfies DocumentValidationError

const validationErrors = [
  {
    properties: [
      {
        name: [
          {
            operatorName: 'maxLength',
            specifiedAs: { maxLength: 20 },
            reason: 'specified string length was not satisfied',
          },
        ],
      },
    ],
  },
] satisfies NonNullable<ValidationErrors>

describe('mongo validation error types', () => {
  it('exposes the expected structural types', () => {
    expectTypeOf<ValidationDetail>().toEqualTypeOf<{
      operatorName?: string
      specifiedAs?: Record<string, unknown>
      reason?: string
      consideredValue?: unknown
      consideredType?: unknown
    }>()
    expectTypeOf<ValidationProperty>().toEqualTypeOf<{
      propertyName: string
      details: ValidationDetail[]
    }>()
    expectTypeOf<DocumentValidationError>().toEqualTypeOf<{
      failingDocumentId?: string
      details?: {
        operatorName?: string
        schemaRulesNotSatisfied?: [
          {
            operatorName: string
            propertiesNotSatisfied?: readonly ValidationProperty[] | null
          },
        ]
      }
    }>()
    expectTypeOf<ValidationErrors>().toEqualTypeOf<Record<string, Record<string, ValidationDetail[]>[]>[] | undefined>()
  })

  it('accepts representative validation payloads', () => {
    expectTypeOf(documentValidationError).toExtend<DocumentValidationError>()
    expectTypeOf(validationErrors).toExtend<NonNullable<ValidationErrors>>()
  })

  it('exposes the expected function and class signatures', () => {
    expectTypeOf(extractValidationErrors).parameters.toEqualTypeOf<[Readonly<MongoServerError>]>()
    expectTypeOf(extractValidationErrors).returns.toEqualTypeOf<ValidationErrors>()
    expectTypeOf<MongoValidationError['getValidationErrorsAsString']>().parameters.toEqualTypeOf<[]>()
    expectTypeOf<MongoValidationError['getValidationErrorsAsString']>().returns.toEqualTypeOf<string | undefined>()
    expectTypeOf<MongoValidationError['getFieldErrors']>().parameters.toEqualTypeOf<[fieldName: string]>()
    expectTypeOf<MongoValidationError['getFieldErrors']>().returns.toEqualTypeOf<ValidationDetail[] | undefined>()
    expectTypeOf<MongoValidationError['validationErrors']>().toEqualTypeOf<ValidationErrors | undefined>()
    expectTypeOf<MongoValidationError['hasValidationFailures']>().toEqualTypeOf<boolean>()
  })

  it('narrows unknown values with the Mongo server error type guard', () => {
    const assertNarrowing = (error: unknown) => {
      if (isMongoServerError(error)) {
        expectTypeOf(error).toEqualTypeOf<MongoServerError>()
        return
      }

      expectTypeOf(error).toEqualTypeOf<unknown>()
    }

    assertNarrowing(new MongoServerError({ code: 121 }))
  })
})
