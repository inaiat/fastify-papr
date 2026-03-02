import { equal, rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import fastifyPaprPlugin, { asCollection } from '../src/index.js'
import { hasUserModel, userSchema } from './helpers/model.js'
import type { MongoContext } from './helpers/server.js'
import { getConfiguredTestServer, setupMongoContext, tearDownMongoContext } from './helpers/server.js'

const getUserModel = (papr: Parameters<typeof hasUserModel>[0]) => {
  if (!hasUserModel(papr)) {
    throw new Error('User model not registered')
  }

  return papr.user
}

const seedUsers = async (
  user: ReturnType<typeof getUserModel>,
  users: readonly { age: number; name: string; phone: string }[],
) => {
  for (const entry of users) {
    await user.insertOne(entry)
  }
}

await describe('Index', async () => {
  let mut_mongoContext: MongoContext
  const usersToInsert = [
    { name: 'Elizeu Drummond', age: 35, phone: '552124561234' },
    { name: 'Luiz Pareto', age: 70, phone: '552124561234' },
    { name: 'José Augusto', age: 25, phone: '552124561234' },
  ] as const

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
    const user = getUserModel(fastify.papr)
    await seedUsers(user, usersToInsert)

    const r = db.collection('user').find().hint({ age: 1 })

    const e = await r.explain()

    equal(e.ok, 1)
    equal((await user.find({})).length, 3)
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
    const user = getUserModel(fastify.papr)
    await seedUsers(user, usersToInsert)

    const r = db.collection('user').find().hint({ name: -1 })

    await rejects(async () => r.explain(), {
      name: 'MongoServerError',
      code: 2,
    })
  })
})
