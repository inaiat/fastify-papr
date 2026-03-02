import { MongoServerError } from 'mongodb'
import { deepEqual, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import fastifyPaprPlugin, { asCollection } from '../src/index.js'
import {
  hasOrderDefaultsModel,
  hasOrderModel,
  hasUserModel,
  orderSchema,
  orderSchemaWithDefaults,
  userSchema,
} from './helpers/model.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

const getRegisteredModels = (papr: Parameters<typeof hasUserModel>[0]) => {
  if (!hasUserModel(papr) || !hasOrderModel(papr)) {
    throw new Error('Required models not registered')
  }

  return {
    order: papr.order,
    user: papr.user,
  }
}

const getOrderDefaultsModel = (papr: Parameters<typeof hasOrderDefaultsModel>[0]) => {
  if (!hasOrderDefaultsModel(papr)) {
    throw new Error('Order defaults model not registered')
  }

  return papr.orderDefaults
}

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
    const { order: orderModel, user: userModel } = getRegisteredModels(fastify.papr)

    const user = { name: 'Elizeu Drummond', age: 30, phone: '552124561234' }
    const result = await userModel.insertOne(user)

    deepEqual(await userModel.findById(result._id), { _id: result._id, ...user })

    const order = { orderNumber: 1234, description: 'notebook', date: new Date() }
    const orderResult = await orderModel.insertOne(order)

    deepEqual(await orderModel.findById(orderResult._id), { _id: orderResult._id, ...order })
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
    const { order: orderModel, user: userModel } = getRegisteredModels(fastify.papr)

    const user = { name: 'Elizeu Drummond', age: 400, phone: '552124561234' }

    await rejects(async () => userModel.insertOne(user), MongoServerError)

    const order = { orderNumber: 1234, description: 'n', date: new Date() }
    await rejects(async () => orderModel.insertOne(order), MongoServerError)
  })

  await it('one collection with default values, insert and retrieve', async () => {
    const { server: fastify } = getConfiguredTestServer()

    await fastify.register(fastifyPaprPlugin, {
      db: mut_mongoContext.db,
      models: {
        orderDefaults: asCollection('orderDefaults', orderSchemaWithDefaults),
      },
    })
    const orderDefaultsModel = getOrderDefaultsModel(fastify.papr)

    const order = { description: 'notebook', date: new Date() }
    const orderResult = await orderDefaultsModel.insertOne(order)

    deepEqual(await orderDefaultsModel.findById(orderResult._id), {
      _id: orderResult._id,
      ...order,
      orderNumber: 1,
    })
  })
})
