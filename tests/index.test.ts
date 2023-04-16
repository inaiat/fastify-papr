import type {Model} from 'papr'
import {schema, types} from 'papr'
import { MongoServerError } from 'mongodb'
import fastifyPaprPlugin, { asCollection} from '../src/index.js'
import {getConfiguredTestServer, test} from './helpers/server.js'

export const userSchema = schema({
  name: types.string({required: true, maxLength: 20}),
  phone: types.string({required: true, minimum: 14}),
  age: types.number({required: true, minimum: 18, maximum: 200}),
})

declare module 'fastify' {
  interface PaprModels {
    user: Model<typeof userSchema[0], typeof userSchema[1]>;
  }
}

test('Test if index exists and works', async t => {
  const {server: fastify} = getConfiguredTestServer()

  const db = t.context.client.db()

  await fastify.register(fastifyPaprPlugin, {
    db,
    models: {
      user: asCollection('user', userSchema, [{key: {name: -1}}, {key: {age: 1}}]),
    },
  })

  await fastify.papr.user.insertOne({name: 'Elizeu Drummond', age: 35, phone: '552124561234'})
  await fastify.papr.user.insertOne({name: 'Luiz Pareto', age: 70, phone: '552124561234'})
  await fastify.papr.user.insertOne({name: 'José Augusto', age: 25, phone: '552124561234'})

  const r = db.collection('user').find().hint({age: 1})

  const e = await r.explain()

  t.is(e.ok, 1)
  t.is((await fastify.papr.user.find({})).length, 3)
})

test('Missing index should fail', async t => {
  const {server: fastify} = getConfiguredTestServer()

  const db = t.context.client.db()

  await fastify.register(fastifyPaprPlugin, {
    db,
    models: {
      user: asCollection('user', userSchema),
    },
  })

  await fastify.papr.user.insertOne({name: 'Elizeu Drummond', age: 35, phone: '552124561234'})
  await fastify.papr.user.insertOne({name: 'Luiz Pareto', age: 70, phone: '552124561234'})
  await fastify.papr.user.insertOne({name: 'José Augusto', age: 25, phone: '552124561234'})

  const r = db.collection('user').find().hint({name: -1})

  const error = await t.throwsAsync(async () => r.explain(), {
    instanceOf: MongoServerError,
  })

  t.is(error?.code, 2)
})

