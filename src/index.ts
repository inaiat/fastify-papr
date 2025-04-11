/**
 * @module fastify-papr
 * A Fastify plugin for Papr (MongoDB schema validation)
 */

// Export main plugin functions
export { asCollection, fastifyPaprPlugin } from './fastify-papr-plugin.js'

// Export validation error types and handling
export type {
  DocumentValidationError,
  ValidationDetail,
  ValidationErrors,
  ValidationProperty,
} from './mongo-validation-error.js'
export { extractValidationErrors, isMongoServerError, MongoValidationError } from './mongo-validation-error.js'

// Export plugin types
export type { FastifyPapr, FastifyPaprOptions, ModelRegistration, ModelRegistrationPair } from './types.js'

// Default export
export { fastifyPaprPlugin as default } from './fastify-papr-plugin.js'
