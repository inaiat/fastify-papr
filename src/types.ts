import { asModel } from './index.js'
import type { Model } from 'papr'
import type { Db } from 'mongodb'

export type PaprModelItem = ReturnType<typeof asModel>

export type ModelRegistrationPair<T> = {
  [U in keyof T]: PaprModelItem
}

export interface PaprModels {
  [key: string]: Model<any, any>
}

export interface FastifyPaprNestedObject {
  [name: string]: PaprModels
}

export type FastifyPaprOptions = {
  name?: string
  db: Db
  models: ModelRegistrationPair<PaprModels>
}

declare module 'fastify' {
  interface FastifyInstance {
    papr: PaprModels & FastifyPaprNestedObject
  }
}
