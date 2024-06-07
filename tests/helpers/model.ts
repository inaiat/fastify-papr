import type { Model } from 'papr'
import { schema, types } from 'papr'

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

// We use partial values here just for the tests. Dont use ? on Production
declare module '../../src/index.js' {
  interface FastifyPapr {
    user?: Model<typeof userSchema[0], typeof userSchema[1]>
    order?: Model<typeof orderSchema[0], typeof orderSchema[1]>
    orderDefaults?: Model<typeof orderSchemaWithDefaults[0], typeof orderSchemaWithDefaults[1]>
    db1?: { user: Model<typeof userSchema[0], typeof userSchema[1]> }
    db2?: { order: Model<typeof orderSchema[0], typeof orderSchema[1]> }
  }
}
