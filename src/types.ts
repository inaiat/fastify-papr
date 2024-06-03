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

export type ColModel<T extends BaseSchema, U extends SchemaOptions<Partial<T>>> = Model<T, U>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FastifyPapr<T extends BaseSchema = any, U extends SchemaOptions<Partial<T>> = any> = Record<
  string,
  ColModel<T, U> | Record<string, ColModel<T, U>>
>

export type PaprDb = Record<string, FastifyPapr>

export type FastifyPaprOptions = {
  name?: string
  db: Db
  models: ModelRegistrationPair<FastifyPapr>
  disableSchemaReconciliation?: boolean
}

declare module 'fastify' {
  interface FastifyInstance {
    papr: FastifyPapr
    // paprDb: PaprDb
  }
}
