import type {Model} from 'papr'
import type {Db} from 'mongodb'
import type {asModel} from './index.js'

export type PaprModelItem = ReturnType<typeof asModel>

export type ModelRegistrationPair<T> = {
  [U in keyof T]: PaprModelItem
}

export type PaprModels = Record<string, Model<any, any>>

export type FastifyPaprNestedObject = Record<string, PaprModels>

export type FastifyPaprOptions = {
  name?: string;
  db: Db;
  models: ModelRegistrationPair<PaprModels>;
  disableSchemaReconciliation?: boolean;
}

declare module 'fastify' {
  interface FastifyInstance {
    papr: PaprModels & FastifyPaprNestedObject;
  }
}
