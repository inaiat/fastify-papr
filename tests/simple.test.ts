import { deepEqual, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'vite-plus/test'
import fastifyPaprPlugin, { asCollection } from '../src/index.js'
import { hasUserModel, userSchema } from './helpers/model.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

describe('simple tests', () => {
  let mut_mongoContext: MongoContext

  beforeEach(async () => {
    mut_mongoContext = await setupMongoContext()
  })

  afterEach(async () => {
    await tearDownMongoContext(mut_mongoContext)
  })

  it('insert one line using papr plugin', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asCollection('user', userSchema),
      },
    })
    const papr = fastify.papr
    if (!hasUserModel(papr)) {
      throw new Error('User model not registered')
    }

    const user = { name: 'Elizeu Drummond', age: 40, phone: '552124561234' }
    const result = await papr.user.insertOne(user)
    const findResult = await papr.user.findById(result._id)
    deepEqual(findResult, { _id: result._id, ...user })
  })

  it('Should papr return erro because name has more than 20 characters', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asCollection('user', userSchema),
      },
    })
    const papr = fastify.papr
    if (!hasUserModel(papr)) {
      throw new Error('User model not registered')
    }

    const sample = { name: 'Elizeu Drummond Giant Name', age: 40, phone: '552124561234' }

    await rejects(async () => papr.user.insertOne(sample), {
      name: 'MongoServerError',
      message: 'Document failed validation',
    })
  })
})
