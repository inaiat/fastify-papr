import type { FastifyInstance } from 'fastify'
import type { Db, IndexDescription } from 'mongodb'
import type { BaseSchema, SchemaOptions } from 'papr'
import Papr from 'papr'
import type { ModelRegistrationPair } from './types.js'

/**
 * Creates a helper for managing Papr models
 * Handles model registration and index creation
 *
 * @param fastify Fastify instance for logging
 * @param db MongoDB database connection
 * @param disableSchemaReconciliation Whether to skip schema validation reconciliation
 * @returns Object with registration methods
 */
export const paprHelper = (fastify: Readonly<FastifyInstance>, db: Db, disableSchemaReconciliation = false) => {
  const papr = new Papr()
  papr.initialize(db)

  /**
   * Registers a model with Papr
   * @param collectionName MongoDB collection name
   * @param collectionSchema Schema definition and options
   * @returns Registered Papr model
   */
  const registerModel = async <TSchema extends BaseSchema, TOptions extends SchemaOptions<TSchema>>(
    collectionName: string,
    collectionSchema: [TSchema, TOptions],
  ) => {
    const model = papr.model(collectionName, collectionSchema)

    if (!disableSchemaReconciliation) {
      await papr.updateSchema(model)
    }

    return model
  }

  /**
   * Creates MongoDB indexes for a collection
   * @param collectionName MongoDB collection name
   * @param indexes Array of index descriptions
   * @returns Array of created index names
   */
  const registerIndexes = async (collectionName: string, indexes: readonly IndexDescription[]) =>
    db.collection(collectionName).createIndexes([...indexes])

  return {
    /**
     * Registers multiple models at once
     * @param models Model registration definitions
     * @returns Object with registered models
     */
    async register(models: ModelRegistrationPair) {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(models).map(async ([name, paprModel]) => {
            const model = await registerModel(paprModel.name, paprModel.schema)
            fastify.log.info(`Model ${name} decorated`)
            if (paprModel.indexes) {
              const index = await registerIndexes(paprModel.name, paprModel.indexes)
              fastify.log.info(`Indexes for ${paprModel.name} => ${index.join(', ')} created.`)
            }

            return [name, model] as const
          }),
        ),
      )
    },
  }
}
