import type { Db, IndexDescription } from 'mongodb'
import type { BaseSchema, Model, SchemaOptions } from 'papr'

export type PaprSchemaTuple = readonly [BaseSchema, unknown]

export type PaprDocument<TSchema extends PaprSchemaTuple> = TSchema[0]

export type PaprSchemaDefinition<TSchema extends PaprSchemaTuple> = Extract<
  TSchema[1],
  SchemaOptions<PaprDocument<TSchema>>
>

export type PaprModel<TSchema extends PaprSchemaTuple> = Model<PaprDocument<TSchema>, PaprSchemaDefinition<TSchema>>

/**
 * Main interface for the fastify-papr plugin
 * Contains all registered models and their connections
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FastifyPaprModel = Model<any, any>

export type FastifyPaprConnection = Record<string, FastifyPaprModel>

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface FastifyPapr {
  [key: string]: FastifyPaprModel | FastifyPaprConnection | undefined
}

/**
 * Represents a model registration with its schema and optional indexes
 */
export type ModelRegistration = {
  /** Collection name in MongoDB */
  name: string
  /** Schema definition pair (schema and options) */
  schema: [BaseSchema, SchemaOptions<Partial<BaseSchema>>]
  /** Optional MongoDB indexes to create */
  indexes?: IndexDescription[]
}

/**
 * Maps model registrations to FastifyPapr property names
 */
export type ModelRegistrationPair<TKey extends string = string> = Record<TKey, ModelRegistration>

/**
 * Configuration options for the fastify-papr plugin
 */
export type FastifyPaprOptions = {
  /** Optional name for multiple database support */
  name?: string
  /** MongoDB database instance */
  db: Db
  /** Models to register */
  models: ModelRegistrationPair
  /** Whether to skip schema validation reconciliation */
  disableSchemaReconciliation?: boolean
}
