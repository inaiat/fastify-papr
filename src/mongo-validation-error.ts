import { MongoServerError } from 'mongodb'

/**
 * Represents details about a property that failed validation
 */
export type ValidationDetail = {
  /** The validation operator that failed (e.g., 'maxLength', 'minimum') */
  operatorName?: string
  /** The specification that was violated */
  specifiedAs?: Record<string, unknown>
  /** Human-readable reason for the validation failure */
  reason?: string
  /** The actual value that was rejected */
  consideredValue?: unknown
  /** The type of the value that was rejected */
  consideredType?: unknown
}

/**
 * Represents a property that failed MongoDB validation
 */
export type ValidationProperty = {
  /** Name of the property that failed validation */
  propertyName: string
  /** Details about why validation failed */
  details: ValidationDetail[]
}

/**
 * MongoDB validation error structure as returned by the server
 */
export type DocumentValidationError = {
  /** ID of the document that failed validation */
  failingDocumentId?: string
  /** Error details from MongoDB */
  details?: {
    /** The validation operator (usually '$jsonSchema') */
    operatorName?: string
    /** Rules that weren't satisfied by the document */
    schemaRulesNotSatisfied?: [
      {
        /** The specific rule operator that failed */
        operatorName: string
        /** Properties that didn't satisfy the validation rules */
        propertiesNotSatisfied: ValidationProperty[]
      },
    ]
  }
}

/**
 * A simplified representation of MongoDB validation errors
 * Maps operator names to property details for easier client-side handling
 */
export type ValidationErrors = Record<string, Record<string, ValidationDetail[]>[]>[] | undefined

/**
 * Checks if an error is a MongoDB server error
 * @param error The error to check
 * @returns True if the error is a MongoDB server error
 */
export function isMongoServerError(error: unknown): error is MongoServerError {
  if (error instanceof MongoServerError) {
    return true
  }

  const errorWithCode = error as { code?: number }
  return error instanceof Error && typeof errorWithCode.code === 'number'
}

/**
 * Transforms validation error properties into a more readable format
 * @param properties The properties that failed validation
 * @returns A mapped array of property errors with details
 * @internal
 */
const formatValidationProperties = (properties: readonly ValidationProperty[]) =>
  properties?.map(prop => ({ [prop.propertyName]: prop.details }))

/**
 * Attempts to extract validation error details from a MongoDB server error
 * @param error The MongoDB server error to process
 * @returns A simplified representation of validation errors or undefined if not a validation error
 */
export function extractValidationErrors(
  error: Readonly<MongoServerError>,
): ValidationErrors | undefined {
  // Check if this is actually a MongoDB validation error
  if (!isMongoServerError(error) || error.code !== 121) {
    return undefined
  }

  // Safely extract schema rules not satisfied
  const errInfo = error.errInfo as DocumentValidationError | undefined
  if (!errInfo?.details?.schemaRulesNotSatisfied?.length) {
    return undefined
  }

  const schemaRulesNotSatisfied = errInfo.details.schemaRulesNotSatisfied

  // Transform the schema rules into a more user-friendly format
  const result: ValidationErrors = schemaRulesNotSatisfied.map(rule => ({
    [rule.operatorName]: formatValidationProperties(rule.propertiesNotSatisfied || []),
  }))

  return result.length > 0 ? result : undefined
}

/**
 * Error class that simplifies handling of MongoDB validation errors
 * Extracts and provides easy access to validation details
 */
export class MongoValidationError extends Error {
  /** The extracted validation rules that weren't satisfied */
  validationErrors?: ValidationErrors

  /** Flag indicating whether this is a document validation error */
  hasValidationFailures: boolean

  /**
   * Creates an instance from a MongoDB server error
   * @param mongoError The original MongoDB error
   */
  constructor(mongoError: Readonly<MongoServerError>) {
    super(mongoError.message, { cause: mongoError })
    this.validationErrors = extractValidationErrors(mongoError)
    this.hasValidationFailures = this.validationErrors !== undefined
  }

  /**
   * Returns the validation errors as a JSON string
   * @returns A JSON string of the validation errors or undefined if not a validation error
   */
  getValidationErrorsAsString(): string | undefined {
    return this.hasValidationFailures ? JSON.stringify(this.validationErrors) : undefined
  }

  /**
   * Finds validation errors for a specific field
   * @param fieldName The field name to find errors for
   * @returns Array of validation details for the field or undefined if none found
   */
  getFieldErrors(fieldName: string): ValidationDetail[] | undefined {
    if (!this.hasValidationFailures || !this.validationErrors?.length) {
      return undefined
    }

    for (const ruleSet of this.validationErrors) {
      for (const [, properties] of Object.entries(ruleSet)) {
        for (const property of properties) {
          const field = Object.keys(property).find(key => key === fieldName)
          if (field) {
            return property[field]
          }
        }
      }
    }

    return undefined
  }
}
