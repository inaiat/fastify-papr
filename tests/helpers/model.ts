import type { Model } from 'papr'
import { schema, types } from 'papr'
import type { FastifyPapr } from '../../src/index.js'

export const userSchema = schema({
  name: types.string({ required: true, maxLength: 20 }),
  phone: types.string({ required: true, minimum: 14 }),
  age: types.number({ required: true, minimum: 18, maximum: 200 }),
})

export const orderSchema = schema({
  orderNumber: types.number({ required: true }),
  description: types.string({ minLength: 5, required: true }),
  date: types.date({ required: true }),
})

export const orderSchemaWithDefaults = schema({
  orderNumber: types.number({ required: true }),
  description: types.string({ minLength: 5, required: true }),
  date: types.date({ required: true }),
}, {
  defaults: {
    orderNumber: 1,
  },
})

type UserModel = Model<typeof userSchema[0], typeof userSchema[1]>
type OrderModel = Model<typeof orderSchema[0], typeof orderSchema[1]>
type OrderDefaultsModel = Model<typeof orderSchemaWithDefaults[0], typeof orderSchemaWithDefaults[1]>
type Db1Models = { user: UserModel }
type Db2Models = { order: OrderModel }

export const hasUserModel = (papr: FastifyPapr): papr is FastifyPapr & { user: UserModel } => {
  const user = papr.user
  return user !== undefined && typeof user === 'object' && 'insertOne' in user
}

export const hasOrderModel = (papr: FastifyPapr): papr is FastifyPapr & { order: OrderModel } => {
  const order = papr.order
  return order !== undefined && typeof order === 'object' && 'insertOne' in order
}

export const hasOrderDefaultsModel = (
  papr: FastifyPapr,
): papr is FastifyPapr & { orderDefaults: OrderDefaultsModel } => {
  const orderDefaults = papr.orderDefaults
  return orderDefaults !== undefined && typeof orderDefaults === 'object' && 'insertOne' in orderDefaults
}

export const hasDb1Models = (papr: FastifyPapr): papr is FastifyPapr & { db1: Db1Models } => {
  const db1 = papr.db1
  return db1 !== undefined && typeof db1 === 'object' && 'user' in db1 && db1.user !== undefined
}

export const hasDb2Models = (papr: FastifyPapr): papr is FastifyPapr & { db2: Db2Models } => {
  const db2 = papr.db2
  return db2 !== undefined && typeof db2 === 'object' && 'order' in db2 && db2.order !== undefined
}
