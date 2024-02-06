import type {BaseSchema, Model, SchemaOptions} from 'papr'
import type {Db, IndexDescription} from 'mongodb'

export type PaprModelItem = {
  collectionName: string
  collectionSchema: [BaseSchema, SchemaOptions<Partial<BaseSchema>>]
  collectionIndexes?: IndexDescription[]
}

export type ModelRegistrationPair<T> = {
  [U in keyof T]: PaprModelItem
}

export type IndexesRegistrationPair = {
  collectionName: string;
  collectionIndexes: readonly IndexDescription[];
}

type ColModel = Record<string, Model<any, any>>

export type FastifyPaprNestedObject = Record<string, ColModel>

export type PaprModels = ColModel & FastifyPaprNestedObject

export type FastifyPaprOptions = {
  name?: string
  db: Db
  models: ModelRegistrationPair<PaprModels>
  disableSchemaReconciliation?: boolean
}

declare module 'fastify' {
  interface FastifyInstance {
    papr: PaprModels;
  }
}
