import type { FastifyPluginAsync } from 'fastify'

import fp from 'fastify-plugin'
import type { IndexDescription } from 'mongodb'
import type { BaseSchema, SchemaOptions } from 'papr'
import { paprHelper } from './papr-helper.js'
import type { FastifyPapr, FastifyPaprOptions, ModelRegistration } from './types.js'

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

/**
 * Main Fastify plugin for Papr integration
 * Registers models to MongoDB and decorates fastify with them
 */
export const fastifyPaprPlugin: FastifyPluginAsync<FastifyPaprOptions> = async (mutable_fastify, options) => {
  const helper = paprHelper(
    mutable_fastify,
    options.db,
    options.disableSchemaReconciliation,
  )

  const models = await helper.register(options.models)
  const { name: dbName } = options

  if (dbName) {
    if (mutable_fastify.papr) {
      if (mutable_fastify.papr[dbName]) {
        throw new Error(`Connection name already registered: ${dbName}`)
      }
      mutable_fastify.log.info(`Registering connection name: ${dbName}`)
      mutable_fastify.papr = {
        ...mutable_fastify.papr,

        [dbName]: models,
      }
    } else {
      mutable_fastify.decorate('papr', {
        [dbName]: models,
      })
    }
  } else {
    if (mutable_fastify.papr) {
      const items = Object.keys(mutable_fastify.papr).join(', ')
      throw new Error(`Models already registered: ${items}`)
    } else {
      mutable_fastify.decorate('papr', models)
    }
  }
}

/**
 * Default export as a Fastify plugin
 * Compatible with Fastify v4 and v5
 */
export default fp(fastifyPaprPlugin, {
  name: 'fastify-papr-plugin',
  fastify: '4.x || 5.x',
})
