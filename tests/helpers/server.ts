import {fastify} from 'fastify'
import type {TestFn} from 'ava'
import anyTest from 'ava'
import {MongoMemoryServer} from 'mongodb-memory-server'
import {MongoClient} from 'mongodb'

export const getTestServer = () => {
  const server = fastify({ logger: true})

  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    void reply.status(500)
    void reply.send(error)
  })
  return server
}

export const getRegisteredTestServer = () => {
  const server = getTestServer()
  return {server}
}

export const getConfiguredTestServer = () => {
  const {server} = getRegisteredTestServer()
  return {server}
}

type TestContext = {
  mongoServer: MongoMemoryServer;
  client: MongoClient;
}

export const createMongoServer = async () =>
  MongoMemoryServer.create({
    binary: {
      version: '5.0.10',
    },
  })

export const test = anyTest as TestFn<TestContext>

test.beforeEach(async t => {
  t.context.mongoServer = await createMongoServer()
  t.context.client = await MongoClient.connect(t.context.mongoServer.getUri())
})

test.afterEach(async t => {
  await t.context.mongoServer.stop()
})
