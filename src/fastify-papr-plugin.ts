import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

import fp from 'fastify-plugin'
import type { IndexDescription } from 'mongodb'
import type { BaseSchema, SchemaOptions } from 'papr'
import { ensureMongoDriverVersion } from './mongo-driver-version.js'
import { paprHelper } from './papr-helper.js'
import type { FastifyPapr, FastifyPaprOptions, ModelRegistration } from './types.js'

type RegisteredModels = Awaited<ReturnType<ReturnType<typeof paprHelper>['register']>>

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Papr models accessible through the fastify instance
     * Models can be accessed directly or through a named database connection
     */
    papr: FastifyPapr
  }
}

/**
 * Helper function to create a model registration
 * @param name Collection name
 * @param schema Papr schema definition with options
 * @param indexes Optional MongoDB indexes to create
 * @returns A model registration object
 */
export const asCollection = <TSchema extends BaseSchema>(
  name: string,
  schema: [TSchema, SchemaOptions<Partial<TSchema>>],
  indexes?: IndexDescription[],
): ModelRegistration => ({
  name,
  schema,
  indexes,
})

const registerNamedModels = (mutableFastify: FastifyInstance, dbName: string, models: RegisteredModels) => {
  if (!mutableFastify.papr) {
    mutableFastify.decorate('papr', {
      [dbName]: models,
    })
    return
  }

  if (mutableFastify.papr[dbName]) {
    throw new Error(`Connection name already registered: ${dbName}`)
  }

  mutableFastify.log.info(`Registering connection name: ${dbName}`)
  mutableFastify.papr = {
    ...mutableFastify.papr,
    [dbName]: models,
  }
}

const registerDefaultModels = (mutableFastify: FastifyInstance, models: RegisteredModels) => {
  if (mutableFastify.papr) {
    const items = Object.keys(mutableFastify.papr).join(', ')
    throw new Error(`Models already registered: ${items}`)
  }

  mutableFastify.decorate('papr', models)
}

/**
 * Main Fastify plugin for Papr integration
 * Registers models to MongoDB and decorates fastify with them
 */
export const fastifyPaprPlugin: FastifyPluginAsync<FastifyPaprOptions> = async (mutable_fastify, options) => {
  ensureMongoDriverVersion()

  const helper = paprHelper(
    mutable_fastify,
    options.db,
    options.disableSchemaReconciliation,
  )

  const models = await helper.register(options.models)
  const { name: dbName } = options

  if (dbName) {
    registerNamedModels(mutable_fastify, dbName, models)
    return
  }

  registerDefaultModels(mutable_fastify, models)
}

/**
 * Default export as a Fastify plugin
 * Compatible with Fastify v4 and v5
 */
export default fp(fastifyPaprPlugin, {
  name: 'fastify-papr-plugin',
  fastify: '4.x || 5.x',
})
