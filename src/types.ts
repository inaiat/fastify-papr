import type { Db, IndexDescription } from 'mongodb'
import type { BaseSchema, Model, SchemaOptions } from 'papr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FastifyPapr<T extends BaseSchema = any, U extends SchemaOptions<Partial<T>> = any> {
  [key: string]: Model<T, U> | Record<string, Model<T, U>> | undefined
}

export type ModelRegistration = {
  name: string
  schema: [BaseSchema, SchemaOptions<Partial<BaseSchema>>]
  indexes?: IndexDescription[]
}

export type ModelRegistrationPair<T> = {
  [U in keyof T]: ModelRegistration
}

export type FastifyPaprOptions = {
  name?: string
  db: Db
  models: ModelRegistrationPair<FastifyPapr>
  disableSchemaReconciliation?: boolean
}
