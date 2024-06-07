import { deepEqual } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import fastifyPaprPlugin, { asCollection } from '../src/index.js'
import { orderSchema, userSchema } from './helpers/model.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

await describe('multiple databases', async () => {
  let mut_mongoContext1: MongoContext
  let mut_mongoContext2: MongoContext

  beforeEach(async () => {
    mut_mongoContext1 = await setupMongoContext()
    mut_mongoContext2 = await setupMongoContext()
  })

  afterEach(async () => {
    await tearDownMongoContext(mut_mongoContext1)
    await tearDownMongoContext(mut_mongoContext2)
  })

  await it('multiple databases', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      name: 'db1',
      db: mut_mongoContext1.db,
      models: {
        user: asCollection('user', userSchema),
      },
    })

    await fastify.register(fastifyPaprPlugin, {
      name: 'db2',
      db: mut_mongoContext2.db,
      models: {
        order: asCollection('order', orderSchema),
      },
    })

    const user = { name: 'Elizeu Drummond', age: 40, phone: '552124561234' }
    const result = await fastify.papr.db1!.user.insertOne(user)

    deepEqual(await fastify.papr.db1!.user.findById(result._id), { _id: result._id, ...user })

    const order = { orderNumber: 1234, description: 'notebook', date: new Date() }
    const orderResult = await fastify.papr.db2!.order.insertOne(order)

    deepEqual(await fastify.papr.db2!.order.findById(orderResult._id), { _id: orderResult._id, ...order })
  })
})
