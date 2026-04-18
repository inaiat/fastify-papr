---
name: fastify-papr
description: Use when the task involves integrating `@inaiat/fastify-papr` into a Fastify service, registering Papr models, designing or reviewing `FastifyPapr` type augmentation, handling MongoDB schema validation errors, or applying this library's runtime and packaging constraints correctly.
---

# Fastify Papr

## Overview

Use this skill when working with `@inaiat/fastify-papr` as a consumer or when updating the library itself. It covers the stable usage patterns for dependency setup, model registration, typing, multi-database access, schema reconciliation, and MongoDB validation error handling.

## Quick Rules

- Treat the package as ESM-only. Prefer `import fastifyPaprPlugin, { asCollection } from '@inaiat/fastify-papr'`.
- Assume Node.js `>=22.12.0`, Fastify `>=5.8`, and MongoDB driver `>=7`.
- Consumers usually need `fastify`, `@fastify/mongodb`, `mongodb`, and `papr` installed explicitly alongside this package.
- Register `@fastify/mongodb` before registering this plugin, and pass a concrete `Db` instance as `options.db`.
- Build model registrations with `asCollection(...)` instead of hand-writing objects.
- The `models` object key becomes the property on `fastify.papr`; the first argument to `asCollection` is the MongoDB collection name.
- Prefer one access pattern per app: either direct models on `fastify.papr` or named connections such as `fastify.papr.db1`.
- Do not register unnamed models twice, and do not reuse a named connection. Both cases throw during plugin registration.
- Leave schema reconciliation enabled unless collection validators are managed outside the app.
- In consumers, augment the public module path `'@inaiat/fastify-papr'`, not internal source files.
- For MongoDB schema validation failures, narrow with `isMongoServerError(error) && error.code === 121` before calling `extractValidationErrors(error)` or instantiating `MongoValidationError`.

## Workflow

1. Confirm the runtime and dependency shape first.
   Check that the consumer is using ESM, Node.js `>=22.12.0`, Fastify `>=5.8`, and MongoDB driver `>=7`. If the setup example omits `papr`, `fastify`, or `mongodb`, add them explicitly.

2. Confirm the integration shape.
   Use the default export as the Fastify plugin, register Mongo first, then register Papr models with `asCollection`.

3. Decide the model access pattern early.
   If the service only uses one database, prefer direct models such as `fastify.papr.user`. If it uses multiple databases, register each connection with `options.name` and access models through `fastify.papr.<connectionName>.<modelName>`.

4. Make types explicit.
   Derive model types from schemas with `PaprModel<typeof schema>`. When consumers need typed access through `fastify.papr`, add module augmentation for `FastifyPapr`. If the task is inside this library repo, keep the public package path for user-facing examples and use the type tests to verify exported types.

5. Check registration behavior, not just happy-path usage.
   Make sure examples describe how collection names map to Fastify properties, where indexes are defined, and when `disableSchemaReconciliation` is appropriate. If the task touches registration semantics, mention duplicate-registration failure modes.

6. Keep validation handling structured.
   Do not parse `errInfo` inline in route handlers. Return the structured payload from `extractValidationErrors(error)` when that is enough, or wrap with `MongoValidationError` when field-level branching or richer logging is needed.

7. Preserve the public contract when changing the library.
   If exports, helper types, or validation helpers change, update the consumer-facing type tests and the README examples in the same change.

## References

- For setup, dependency constraints, registration patterns, indexes, schema reconciliation, and multi-database guidance, read [references/integration.md](references/integration.md).
- For exported type helpers, augmentation patterns, duplicate-key vs validation handling, and `MongoValidationError` usage, read [references/types-and-errors.md](references/types-and-errors.md).
