import { rejects } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import type { FastifyPaprOptions } from '../src/index.js'
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

  await it('Should return error if we try to register the same model twice', async () => {
    const { server: fastify } = getConfiguredTestServer()

    const opts: FastifyPaprOptions = {
      db: mut_mongoContext.db,
      models: {
        foo: asCollection('foo', userSchema),
        bar: asCollection('bar', userSchema),
      },
    }

    await fastify.register(fastifyPaprPlugin, opts)

    await rejects(async () => await fastify.register(fastifyPaprPlugin, opts), {
      name: 'Error',
      message: 'Models already registered: foo, bar',
    })
  })

  await it('Should return if we try to register the same db twice', async () => {
    const { server: fastify } = getConfiguredTestServer()

    const opts: FastifyPaprOptions = {
      db: mut_mongoContext.db,
      name: 'db1',
      models: {
        foo: asCollection('foo', userSchema),
        bar: asCollection('bar', userSchema),
      },
    }

    await fastify.register(fastifyPaprPlugin, opts)

    await rejects(async () => await fastify.register(fastifyPaprPlugin, opts), {
      name: 'Error',
      message: 'Connection name already registered: db1',
    })
  })
})
