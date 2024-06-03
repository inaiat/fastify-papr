import type { Db, IndexDescription } from 'mongodb'
import type { BaseSchema, Model, SchemaOptions } from 'papr'

export type PaprModelItem = {
  collectionName: string
  collectionSchema: [BaseSchema, SchemaOptions<Partial<BaseSchema>>]
  collectionIndexes?: IndexDescription[]
}

export type ModelRegistrationPair<T> = {
  [U in keyof T]: PaprModelItem
}

export type IndexesRegistrationPair = {
  collectionName: string
  collectionIndexes: readonly IndexDescription[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PaprModels<T extends BaseSchema = any, U extends SchemaOptions<Partial<T>> = any> = Record<
  string,
  Model<T, U>
>

export type PaprDb = Record<string, PaprModels>

export type FastifyPaprOptions = {
  name?: string
  db: Db
  models: ModelRegistrationPair<PaprModels>
  disableSchemaReconciliation?: boolean
}

declare module 'fastify' {
  interface FastifyInstance {
    papr: PaprModels
    paprDb: PaprDb
  }
}
