import { MongoServerError } from 'mongodb'
import { deepEqual, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import fastifyPaprPlugin, { asCollection } from '../src/index.js'
import { orderSchema, orderSchemaWithDefaults, userSchema } from './helpers/model.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

await describe('multiple collections', async () => {
  let mut_mongoContext: MongoContext

  beforeEach(async () => {
    mut_mongoContext = await setupMongoContext()
  })

  afterEach(async () => {
    await tearDownMongoContext(mut_mongoContext)
  })

  await it('multiple collections insert and retrieve', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asCollection('user', userSchema),
        order: asCollection('order', orderSchema),
      },
    })

    const user = { name: 'Elizeu Drummond', age: 30, phone: '552124561234' }
    const result = await fastify.papr.user!.insertOne(user)

    deepEqual(await fastify.papr.user!.findById(result._id), { _id: result._id, ...user })

    const order = { orderNumber: 1234, description: 'notebook', date: new Date() }
    const orderResult = await fastify.papr.order!.insertOne(order)

    deepEqual(await fastify.papr.order!.findById(orderResult._id), { _id: orderResult._id, ...order })
  })

  await it('validation failed with two col', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        user: asCollection('user', userSchema),
        order: asCollection('order', orderSchema),
      },
    })

    const user = { name: 'Elizeu Drummond', age: 400, phone: '552124561234' }

    await rejects(async () => await fastify.papr.user!.insertOne(user), MongoServerError)

    const order = { orderNumber: 1234, description: 'n', date: new Date() }
    await rejects(async () => await fastify.papr.order!.insertOne(order), MongoServerError)
  })

  await it('one collection with default values, insert and retrieve', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        orderDefaults: asCollection('orderDefaults', orderSchemaWithDefaults),
      },
    })

    const order = { description: 'notebook', date: new Date() }
    const orderResult = await fastify.papr.orderDefaults!.insertOne(order)

    deepEqual(await fastify.papr.orderDefaults!.findById(orderResult._id), {
      _id: orderResult._id,
      ...order,
      orderNumber: 1,
    })
  })
})
