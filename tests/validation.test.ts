import { MongoServerError } from 'mongodb'
import { deepEqual, equal, ok, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import fastifyPaprPlugin, {
  asCollection,
  extractValidationErrors,
  isMongoServerError,
  MongoValidationError,
} from '../src/index.js'
import { userSchema } from './helpers/model.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

const getValidationError = (error: unknown) => {
  ok(error instanceof MongoServerError)
  return new MongoValidationError(error)
}

const assertFieldError = (
  validationError: MongoValidationError,
  {
    fieldName,
    expectedOperatorName,
    expectedConsideredValue,
  }: {
    fieldName: string
    expectedOperatorName: string
    expectedConsideredValue?: unknown
  },
) => {
  const fieldErrors = validationError.getFieldErrors(fieldName)
  equal(fieldErrors?.length, 1)
  if (expectedConsideredValue !== undefined) {
    equal(fieldErrors?.[0]?.consideredValue, expectedConsideredValue)
  }
  equal(fieldErrors?.[0]?.operatorName, expectedOperatorName)
}

const assertDocumentFailedWithNameAndAge = (error: unknown) => {
  const validationError = getValidationError(error)

  // Use index access instead of shift() to avoid mutation.
  equal(
    validationError.validationErrors?.[0]
      ?.properties
      ?.find(p => Object.keys(p)[0] === 'age')
      ?.age?.[0]
      ?.consideredValue,
    1050,
  )
  assertFieldError(validationError, {
    fieldName: 'age',
    expectedOperatorName: 'maximum',
    expectedConsideredValue: 1050,
  })
  assertFieldError(validationError, {
    fieldName: 'name',
    expectedOperatorName: 'maxLength',
  })
  equal(validationError.getFieldErrors('nonExistentField'), undefined)

  return true
}

const assertNonMongoServerErrors = (genericError: Error, notAnError: { code: number; message: string }) => {
  equal(isMongoServerError(genericError), false)
  equal(isMongoServerError(notAnError), false)
  equal(isMongoServerError(null), false)
}

const createValidationRuleError = (operatorName: string, propertiesNotSatisfied?: unknown[] | null) =>
  new MongoServerError({
    code: 121,
    errInfo: {
      details: {
        schemaRulesNotSatisfied: [
          propertiesNotSatisfied === undefined ? { operatorName } : { operatorName, propertiesNotSatisfied },
        ],
      },
    },
  })

const assertEmptyValidationErrorCases = ({
  nonValidationError,
  validationErrorNoDetails,
  validationErrorEmptyDetails,
  validationErrorEmptyRules,
}: {
  nonValidationError: MongoServerError
  validationErrorNoDetails: MongoServerError
  validationErrorEmptyDetails: MongoServerError
  validationErrorEmptyRules: MongoServerError
}) => {
  equal(extractValidationErrors(nonValidationError), undefined)
  equal(extractValidationErrors(validationErrorNoDetails), undefined)
  equal(extractValidationErrors(validationErrorEmptyDetails), undefined)
  equal(extractValidationErrors(validationErrorEmptyRules), undefined)
}

const assertPropertyFallbackValidationErrorCases = (
  validationErrorEmptyProperties: MongoServerError,
  validationErrorNullProperties: MongoServerError,
  validationErrorUndefinedProperties: MongoServerError,
) => {
  deepEqual(extractValidationErrors(validationErrorEmptyProperties), [{ properties: [] }])
  deepEqual(extractValidationErrors(validationErrorNullProperties), [{ required: [] }])
  deepEqual(extractValidationErrors(validationErrorUndefinedProperties), [{ type: [] }])
}

const sample1 = {
  failingDocumentId: '62f2753c0ab71ababe3aec15',
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
                specifiedAs: {
                  maxLength: 20,
                },
                reason: 'specified string length was not satisfied',
                consideredValue: 'Elizeu Drummond Giant Name',
              },
            ],
          },
          {
            propertyName: 'age',
            details: [
              {
                operatorName: 'maximum',
                specifiedAs: {
                  maximum: 200,
                },
                reason: 'comparison failed',
                consideredValue: 500,
              },
            ],
          },
        ],
      },
    ],
  },
}

await describe('Validation', async () => {
  let mut_mongoContext: MongoContext

  beforeEach(async () => {
    mut_mongoContext = await setupMongoContext()
  })

  afterEach(async () => {
    await tearDownMongoContext(mut_mongoContext)
  })

  await it('document failed with name and age', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asCollection('user', userSchema),
      },
    })

    const user = { name: 'Elizeu Drummond Giant Name', age: 1050, phone: '552124561234' }
    await rejects(async () => await fastify.papr.user!.insertOne(user), assertDocumentFailedWithNameAndAge)
  })

  await it('simple doc failed validation should result undefined when schema rules not satisfied', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asCollection('user', userSchema),
      },
    })

    const user = { name: 'Elizeu Drummond', age: 40, phone: '552124561234' }
    const result = await fastify.papr.user!.insertOne(user)

    await rejects(
      async () => await fastify.papr.user!.insertOne({ _id: result._id, ...user }),
      (error) => {
        const validationError = getValidationError(error)
        equal(validationError.hasValidationFailures, false)
        equal(validationError.getValidationErrorsAsString(), undefined)
        // Test getFieldErrors on non-validation errors.
        equal(validationError.getFieldErrors('anyField'), undefined)
        return true
      },
    )

    deepEqual(await fastify.papr.user!.findById(result._id), { _id: result._id, ...user })
  })

  void it('basic parser', () => {
    const m = new MongoServerError({ code: 121, errInfo: sample1 })
    const validationError = new MongoValidationError(m)
    equal(validationError.validationErrors?.length, 1)
    ok(validationError.hasValidationFailures)
    ok(validationError.getValidationErrorsAsString()?.includes('maxLength'))
  })

  void it('isMongoServerError type guard', () => {
    const validationError = new MongoServerError({ code: 121, errInfo: sample1 })
    const duplicateKeyError = new MongoServerError({ code: 11_000 })
    const genericError = new Error('Generic error')
    const errorWithCode = new Error('Error with code') as Error & { code: number }
    errorWithCode.code = 500
    const notAnError = { message: 'Not an error', code: 123 }

    ok(isMongoServerError(validationError))
    ok(isMongoServerError(duplicateKeyError))
    ok(isMongoServerError(errorWithCode))
    assertNonMongoServerErrors(genericError, notAnError)
  })

  void it('extractValidationErrors edge cases', () => {
    const nonValidationError = new MongoServerError({ code: 11_000 })
    const validationErrorNoDetails = new MongoServerError({ code: 121, errInfo: {} })
    const validationErrorEmptyDetails = new MongoServerError({ code: 121, errInfo: { details: {} } })
    const validationErrorEmptyRules = new MongoServerError({
      code: 121,
      errInfo: { details: { schemaRulesNotSatisfied: [] } },
    })
    const validationErrorEmptyProperties = createValidationRuleError('properties', [])
    const validationErrorNullProperties = createValidationRuleError('required', null)
    const validationErrorUndefinedProperties = createValidationRuleError('type')

    assertEmptyValidationErrorCases({
      nonValidationError,
      validationErrorNoDetails,
      validationErrorEmptyDetails,
      validationErrorEmptyRules,
    })
    assertPropertyFallbackValidationErrorCases(
      validationErrorEmptyProperties,
      validationErrorNullProperties,
      validationErrorUndefinedProperties,
    )
  })
})
