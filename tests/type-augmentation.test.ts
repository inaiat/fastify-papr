import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import type { FastifyPapr } from '../src/index.js'
import type { UserModel } from './helpers/model.js'

type Db1Models = { user: UserModel }

declare module '../src/index.js' {
  interface FastifyPapr {
    user: UserModel
    db1: Db1Models
  }
}

const getUserModel = (papr: FastifyPapr): UserModel => papr.user
const getNamedUserModel = (papr: FastifyPapr): UserModel | undefined => papr.db1?.user

describe('type augmentation', () => {
  it('supports concrete model augmentation for direct and named models', () => {
    equal(typeof getUserModel, 'function')
    equal(typeof getNamedUserModel, 'function')
  })
})
