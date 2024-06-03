import { equal, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import type { Model } from 'papr'
import { schema, types } from 'papr'
import fastifyPaprPlugin, { asCollection } from '../src/index.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

export const userSchema = schema({
  name: types.string({ required: true, maxLength: 20 }),
  phone: types.string({ required: true, minimum: 14 }),
  age: types.number({ required: true, minimum: 18, maximum: 200 }),
})

declare module 'fastify' {
  interface PaprModels {
    user: Model<typeof userSchema[0], typeof userSchema[1]>
  }
}

await describe('Index', async () => {
  let mut_mongoContext: MongoContext

  beforeEach(async () => {
    mut_mongoContext = await setupMongoContext()
  })

  afterEach(async () => {
    console.log('Stopping mongo server and closing mongo client')
    await tearDownMongoContext(mut_mongoContext)
  })

  await it('Test if index exists and works', async () => {
    const { server: fastify } = getConfiguredTestServer()

    const db = mut_mongoContext.db

    await fastify.register(fastifyPaprPlugin, {
      db,
      models: {
        user: asCollection('user', userSchema, [{ key: { name: -1 } }, { key: { age: 1 } }]),
      },
    })

    const { user } = fastify.papr

    await user.insertOne({ name: 'Elizeu Drummond', age: 35, phone: '552124561234' })
    await user.insertOne({ name: 'Luiz Pareto', age: 70, phone: '552124561234' })
    await user.insertOne({ name: 'José Augusto', age: 25, phone: '552124561234' })

    const r = db.collection('user').find().hint({ age: 1 })

    const e = await r.explain()

    equal(e.ok, 1)
    equal((await fastify.papr.user.find({})).length, 3)
  })

  await it('Missing index should fail', async () => {
    const { server: fastify } = getConfiguredTestServer()

    const db = mut_mongoContext.db

    await fastify.register(fastifyPaprPlugin, {
      db,
      models: {
        user: asCollection('user', userSchema),
      },
    })

    await fastify.papr.user.insertOne({ name: 'Elizeu Drummond', age: 35, phone: '552124561234' })
    await fastify.papr.user.insertOne({ name: 'Luiz Pareto', age: 70, phone: '552124561234' })
    await fastify.papr.user.insertOne({ name: 'José Augusto', age: 25, phone: '552124561234' })

    const r = db.collection('user').find().hint({ name: -1 })

    await rejects(async () => await r.explain(), {
      name: 'MongoServerError',
      code: 2,
    })
  })
})
