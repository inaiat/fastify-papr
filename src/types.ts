import type { Db, IndexDescription } from 'mongodb'
import type { BaseSchema, Model, SchemaOptions } from 'papr'

/**
 * Main interface for the fastify-papr plugin
 * Contains all registered models and their connections
 */
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/no-explicit-any
export interface FastifyPapr<T extends BaseSchema = any, U extends SchemaOptions<Partial<T>> = any> {
  [key: string]: Model<T, U> | Record<string, Model<T, U>> | undefined
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
export type ModelRegistrationPair<T> = {
  [U in keyof T]: ModelRegistration
}

/**
 * Configuration options for the fastify-papr plugin
 */
export type FastifyPaprOptions = {
  /** Optional name for multiple database support */
  name?: string
  /** MongoDB database instance */
  db: Db
  /** Models to register */
  models: ModelRegistrationPair<FastifyPapr>
  /** Whether to skip schema validation reconciliation */
  disableSchemaReconciliation?: boolean
}
