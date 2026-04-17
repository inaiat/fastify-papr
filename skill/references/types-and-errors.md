# Types and Validation Errors

## Public type helpers

The library exports helper types for building a typed application layer around Papr schemas:

- `PaprSchemaTuple`: generic constraint for Papr schema tuples
- `PaprDocument<TSchema>`: document shape derived from a schema tuple
- `PaprSchemaDefinition<TSchema>`: schema options derived from a schema tuple
- `PaprModel<TSchema>`: concrete Papr model type for a schema tuple
- `FastifyPapr`: augmented shape exposed at `fastify.papr`
- `FastifyPaprOptions`: plugin options
- `ModelRegistration` and `ModelRegistrationPair`: registration helpers used by the plugin

Prefer deriving model types from the schema instead of re-declaring them manually:

```ts
import { schema, types } from 'papr'
import type { PaprModel } from '@inaiat/fastify-papr'

const userSchema = schema({
  name: types.string({ required: true }),
})

type UserModel = PaprModel<typeof userSchema>
```

## Module augmentation pattern

In consumers, augment the public package path:

```ts
import type { PaprModel } from '@inaiat/fastify-papr'

type UserModel = PaprModel<typeof userSchema>

declare module '@inaiat/fastify-papr' {
  interface FastifyPapr {
    user: UserModel
    db1: {
      user: UserModel
    }
  }
}
```

Best practices:

- Augment only the keys your service actually registers.
- Keep augmentation next to the plugin-registration module or in a dedicated types module loaded by TypeScript.
- When working inside this library repo, use the type tests as the contract for exported helpers.

## Type-test guidance for this repo

When changing the public type surface, update:

- `tests/types.test.ts`
- `tests/type-augmentation.test.ts`
- `tests/mongo-validation-error.types.test.ts`

Use `expectTypeOf` for compile-time contracts. Prefer tests that prove the public package contract rather than local implementation details.

## Validation error handling

`isMongoServerError` is only the first gate. For schema validation failures, also check `error.code === 121`.

Recommended route pattern:

```ts
import { MongoValidationError, isMongoServerError } from '@inaiat/fastify-papr'

try {
  await fastify.papr.user.insertOne(req.body)
} catch (error) {
  if (isMongoServerError(error) && error.code === 121) {
    const validationError = new MongoValidationError(error)

    return reply.status(400).send({
      message: 'Validation failed',
      errors: validationError.validationErrors,
    })
  }

  throw error
}
```

Prefer these helpers over manual `errInfo` traversal:

- `extractValidationErrors(error)`: returns the simplified structured error payload or `undefined`
- `new MongoValidationError(error)`: wraps the Mongo error and exposes helper methods
- `validationErrors`: structured validation payload
- `hasValidationFailures`: boolean shortcut
- `getValidationErrorsAsString()`: useful for logs
- `getFieldErrors(fieldName)`: useful when behavior depends on a specific field failure

Best practices:

- Return the structured `validationErrors` payload to API clients when appropriate.
- Use `getValidationErrorsAsString()` for logs, not as the primary application contract.
- Avoid treating every `MongoServerError` as a validation error; duplicate key and other server errors need different handling.
