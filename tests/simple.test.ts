import { deepEqual, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import type { Model } from 'papr'
import { schema, types } from 'papr'
import fastifyPaprPlugin, { asCollection, asModel } from '../src/index.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

export const userSchema = schema({
  name: types.string({ required: true, maxLength: 20 }),
  phone: types.string({ required: true, minimum: 14 }),
  age: types.number({ required: true, minimum: 18, maximum: 200 }),
})

declare module 'fastify' {
  interface FastifyPapr {
    user: Model<typeof userSchema[0], typeof userSchema[1]>
  }
}

await describe('simple tests', async () => {
  let mut_mongoContext: MongoContext

  beforeEach(async () => {
    mut_mongoContext = await setupMongoContext()
  })

  afterEach(async () => {
    await tearDownMongoContext(mut_mongoContext)
  })

  await it('insert one line using papr plugin', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asModel('user', userSchema),
      },
    })

    const user = { name: 'Elizeu Drummond', age: 40, phone: '552124561234' }
    const result = await fastify.papr.user.insertOne(user)
    const findResult = await fastify.papr.user.findById(result._id)
    deepEqual(findResult, { _id: result._id, ...user })
  })

  await it('Should papr return erro because name has more than 20 characters', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asCollection('user', userSchema),
      },
    })

    const sample = { name: 'Elizeu Drummond Giant Name', age: 40, phone: '552124561234' }

    await rejects(async () => await fastify.papr.user.insertOne(sample), {
      name: 'MongoServerError',
      message: 'Document failed validation',
    })
  })
})
