import type {Model} from 'papr'
import {schema, types} from 'papr'
import {MongoServerError} from 'mongodb'
import fastifyPaprPlugin, {asModel} from '../src/index.js'
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

test('insert one line using papr plugin', async t => {
  const {server: fastify} = getConfiguredTestServer()

  await fastify.register(fastifyPaprPlugin, {
    db: t.context.client.db(),
    models: {
      user: asModel('user', userSchema),
    },
  })

  const user = {name: 'Elizeu Drummond', age: 40, phone: '552124561234'}
  const result = fastify.papr.user.insertOne(user)

  t.deepEqual(await fastify.papr.user.findById((await result)._id), {_id: (await result)._id, ...user})
})

test('Should papr return erro because name has more than 20 characters', async t => {
  const {server: fastify} = getConfiguredTestServer()

  await fastify.register(fastifyPaprPlugin, {
    db: t.context.client.db(),
    models: {
      user: asModel('user', userSchema),
    },
  })

  const user = {name: 'Elizeu Drummond Giant Name', age: 40, phone: '552124561234'}
  const error = await t.throwsAsync(async () => fastify.papr.user.insertOne(user), {
    instanceOf: MongoServerError,
  })

  t.is(error?.message, 'Document failed validation')
})
