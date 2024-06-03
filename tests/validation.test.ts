import { MongoServerError } from 'mongodb'
import { deepEqual, equal, ok, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import type { Model } from 'papr'
import { schema, types } from 'papr'
import fastifyPaprPlugin, { asModel } from '../src/index.js'
import { SimpleDocFailedValidationError } from '../src/simple-doc-failed-validation.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

export const userSchema = schema({
  name: types.string({ uniqueItems: true, required: true, maxLength: 20 }),
  phone: types.string({ required: true, minimum: 14 }),
  age: types.number({ required: true, minimum: 18, maximum: 200 }),
})

declare module 'fastify' {
  interface FastifyPapr {
    user: Model<typeof userSchema[0], typeof userSchema[1]>
  }
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
        user: asModel('user', userSchema),
      },
    })

    const user = { name: 'Elizeu Drummond Giant Name', age: 1050, phone: '552124561234' }
    await rejects(async () => await fastify.papr.user.insertOne(user), (error) => {
      ok(error instanceof MongoServerError)
      const simpleError = new SimpleDocFailedValidationError(error!)
      equal(
        // eslint-disable-next-line functional/immutable-data
        simpleError.schemaRulesNotSatisfied
          ?.shift()
          ?.properties.find(p => Object.keys(p).shift() === 'age')
          ?.age?.shift()?.consideredValue,
        1050,
      )
      return true
    })
  })

  await it('simple doc failed validation should result undefined when schema rules not satisfied', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asModel('user', userSchema),
      },
    })

    const user = { name: 'Elizeu Drummond', age: 40, phone: '552124561234' }
    const result = await fastify.papr.user.insertOne(user)

    await rejects(
      async () => await fastify.papr.user.insertOne({ _id: result._id, ...user }),
      (error) => {
        ok(error instanceof MongoServerError)
        const simpleError = new SimpleDocFailedValidationError(error!)
        equal(simpleError.schemaRulesNotSatisfiedAsString(), undefined)
        return true
      },
    )

    deepEqual(await fastify.papr.user.findById(result._id), { _id: result._id, ...user })
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

  it('basic parser', () => {
    const m = new MongoServerError({ code: 121, errInfo: sample1 })
    const simpleError = new SimpleDocFailedValidationError(m)
    equal(simpleError.schemaRulesNotSatisfied?.length, 1)
  })
})
