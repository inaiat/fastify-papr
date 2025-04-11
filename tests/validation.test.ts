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
    await rejects(async () => await fastify.papr.user!.insertOne(user), (error) => {
      ok(error instanceof MongoServerError)
      const validationError = new MongoValidationError(error)

      // Use index access instead of shift() to avoid mutation
      equal(
        validationError.validationErrors?.[0]
          ?.properties
          ?.find(p => Object.keys(p)[0] === 'age')
          ?.age?.[0]
          ?.consideredValue,
        1050,
      )
      // Test getFieldErrors
      const ageErrors = validationError.getFieldErrors('age')
      equal(ageErrors?.length, 1)
      equal(ageErrors?.[0]?.consideredValue, 1050)
      equal(ageErrors?.[0]?.operatorName, 'maximum')

      const nameErrors = validationError.getFieldErrors('name')
      equal(nameErrors?.length, 1)
      equal(nameErrors?.[0]?.operatorName, 'maxLength')

      // Test non-existent field
      equal(validationError.getFieldErrors('nonExistentField'), undefined)

      return true
    })
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
        ok(error instanceof MongoServerError)
        // Test constructor and getValidationErrorsAsString for non-validation errors
        const validationError = new MongoValidationError(error)
        equal(validationError.hasValidationFailures, false)
        equal(validationError.getValidationErrorsAsString(), undefined)
        equal(validationError.getFieldErrors('anyField'), undefined) // Test getFieldErrors on non-validation error
        return true
      },
    )

    deepEqual(await fastify.papr.user!.findById(result._id), { _id: result._id, ...user })
  })

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

  void it('basic parser', () => {
    const m = new MongoServerError({ code: 121, errInfo: sample1 })
    const validationError = new MongoValidationError(m)
    equal(validationError.validationErrors?.length, 1)
    ok(validationError.hasValidationFailures)
    ok(validationError.getValidationErrorsAsString()?.includes('maxLength'))
  })

  void it('isMongoServerError type guard', () => {
    const validationError = new MongoServerError({ code: 121, errInfo: sample1 })
    const duplicateKeyError = new MongoServerError({ code: 11_000 }) // Fix numeric separator
    const genericError = new Error('Generic error')
    const errorWithCode = new Error('Error with code') as Error & { code: number }
    errorWithCode.code = 500
    const notAnError = { message: 'Not an error', code: 123 }

    ok(isMongoServerError(validationError))
    ok(isMongoServerError(duplicateKeyError))
    ok(isMongoServerError(errorWithCode)) // Test plain Error with code
    equal(isMongoServerError(genericError), false)
    equal(isMongoServerError(notAnError), false) // Test non-Error object
    equal(isMongoServerError(null), false)
  })

  void it('extractValidationErrors edge cases', () => {
    const nonValidationError = new MongoServerError({ code: 11_000 }) // Duplicate key
    const validationErrorNoDetails = new MongoServerError({ code: 121, errInfo: {} })
    const validationErrorEmptyDetails = new MongoServerError({ code: 121, errInfo: { details: {} } })
    const validationErrorEmptyRules = new MongoServerError({
      code: 121,
      errInfo: { details: { schemaRulesNotSatisfied: [] } },
    })
    const validationErrorEmptyProperties = new MongoServerError({
      code: 121,
      errInfo: {
        details: {
          schemaRulesNotSatisfied: [{ operatorName: 'properties', propertiesNotSatisfied: [] }],
        },
      },
    })
    // Add case with null/undefined propertiesNotSatisfied
    const validationErrorNullProperties = new MongoServerError({
      code: 121,
      errInfo: {
        details: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schemaRulesNotSatisfied: [{ operatorName: 'required', propertiesNotSatisfied: null as any }],
        },
      },
    })
    const validationErrorUndefinedProperties = new MongoServerError({
      code: 121,
      errInfo: {
        details: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schemaRulesNotSatisfied: [{ operatorName: 'type', propertiesNotSatisfied: undefined as any }],
        },
      },
    })

    equal(extractValidationErrors(nonValidationError), undefined)
    equal(extractValidationErrors(validationErrorNoDetails), undefined)
    equal(extractValidationErrors(validationErrorEmptyDetails), undefined)
    // This covers the `result.length > 0 ? result : undefined` returning undefined (line 106)
    equal(extractValidationErrors(validationErrorEmptyRules), undefined)
    // This covers `rule.propertiesNotSatisfied || []` when propertiesNotSatisfied is empty (line 104)
    // and `result.length > 0` returning result (line 106)
    deepEqual(extractValidationErrors(validationErrorEmptyProperties), [{ properties: [] }])
    // Add assertions for null/undefined cases, covering the `|| []` fallback (line 104)
    deepEqual(extractValidationErrors(validationErrorNullProperties), [{ required: [] }])
    deepEqual(extractValidationErrors(validationErrorUndefinedProperties), [{ type: [] }])
  })
})
