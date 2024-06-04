import { fastify } from 'fastify'
import type { Db } from 'mongodb'
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

export const getTestServer = () => {
  const server = fastify({ logger: true })

  server.setErrorHandler((error, _, reply) => {
    console.error(error)
    void reply.status(500)
    void reply.send(error)
  })
  return server
}

export const getRegisteredTestServer = () => {
  const server = getTestServer()
  return { server }
}

export const getConfiguredTestServer = () => {
  const { server } = getRegisteredTestServer()
  return { server }
}

export const createMongoServer = async () =>
  await MongoMemoryServer.create({
    binary: {
      version: '6.0.15',
    },
  })

export type MongoContext = {
  mongoServer: MongoMemoryServer
  mongoClient: MongoClient
  db: Db
}

export const setupMongoContext = async (): Promise<MongoContext> => {
  const mongoServer = await createMongoServer()
  const mongoClient = await MongoClient.connect(mongoServer.getUri())
  return {
    mongoServer,
    mongoClient,
    db: mongoClient.db(),
  }
}

// eslint-disable-next-line functional/prefer-immutable-types
export const tearDownMongoContext = async (mut_context: MongoContext) => {
  try {
    await mut_context?.mongoClient.close()
    await mut_context?.mongoServer?.stop()
  } catch (error) {
    console.error('Error on tearDownMongoContext', error)
  }
}
