import { deepEqual, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import fastifyPaprPlugin, { asCollection } from '../src/index.js'
import { userSchema } from './helpers/model.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

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
        user: asCollection('user', userSchema),
      },
    })

    const user = { name: 'Elizeu Drummond', age: 40, phone: '552124561234' }
    const result = await fastify.papr.user!.insertOne(user)
    const findResult = await fastify.papr.user!.findById(result._id)
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

    await rejects(async () => await fastify.papr.user!.insertOne(sample), {
      name: 'MongoServerError',
      message: 'Document failed validation',
    })
  })
})
