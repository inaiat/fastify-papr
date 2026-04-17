import type { FastifyPluginAsync } from 'fastify'
import type { Db } from 'mongodb'
import type { Model } from 'papr'
import { describe, expectTypeOf, it } from 'vite-plus/test'
import fastifyPaprPlugin, {
  asCollection,
  type FastifyPapr,
  type FastifyPaprOptions,
  type ModelRegistration,
  type ModelRegistrationPair,
  type PaprDocument,
  type PaprModel,
  type PaprSchemaDefinition,
  type PaprSchemaTuple,
} from '../src/index.js'
import { orderSchema, userSchema } from './helpers/model.js'
import type { UserModel } from './helpers/model.js'

type UserSchemaTuple = typeof userSchema
type UserDocument = UserSchemaTuple[0]
type UserSchemaOptions = UserSchemaTuple[1]
type NamedUserModels = { user: UserModel }

const registrations = {
  user: asCollection('user', userSchema),
  order: asCollection('order', orderSchema),
} satisfies ModelRegistrationPair

declare module '../src/index.js' {
  interface FastifyPapr {
    user: UserModel
    db1: NamedUserModels
  }
}

describe('public type exports', () => {
  it('maps papr schema tuples into exported helper types', () => {
    expectTypeOf<UserSchemaTuple>().toExtend<PaprSchemaTuple>()
    expectTypeOf<PaprDocument<UserSchemaTuple>>().toEqualTypeOf<UserDocument>()
    expectTypeOf<PaprSchemaDefinition<UserSchemaTuple>>().toEqualTypeOf<UserSchemaOptions>()
    expectTypeOf<PaprModel<UserSchemaTuple>>().toEqualTypeOf<Model<UserDocument, UserSchemaOptions>>()
    expectTypeOf<UserModel>().toEqualTypeOf<PaprModel<UserSchemaTuple>>()
  })

  it('accepts collection registrations in exported plugin option types', () => {
    expectTypeOf(registrations.user).toEqualTypeOf<ModelRegistration>()
    expectTypeOf(registrations).toExtend<ModelRegistrationPair>()
    expectTypeOf<FastifyPaprOptions>().toExtend<{
      db: Db
      disableSchemaReconciliation?: boolean
      models: ModelRegistrationPair
      name?: string
    }>()
    expectTypeOf(fastifyPaprPlugin).toExtend<FastifyPluginAsync<FastifyPaprOptions>>()
  })

  it('supports direct and named FastifyPapr augmentation', () => {
    expectTypeOf<FastifyPapr['user']>().toEqualTypeOf<UserModel>()
    expectTypeOf<FastifyPapr['db1']>().toEqualTypeOf<NamedUserModels>()
  })
})
