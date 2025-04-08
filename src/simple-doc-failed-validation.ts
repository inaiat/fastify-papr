import { MongoServerError } from 'mongodb'

/**
 * Represents details about a property that failed validation
 */
export type PropertyDetail = {
  operatorName?: string
  specifiedAs?: Record<string, unknown>
  reason?: string
  consideredValue?: unknown
  consideredType?: unknown
}

/**
 * Represents a property that failed MongoDB validation
 */
export type PropertiesNotSatisfied = {
  propertyName: string
  details: PropertyDetail[]
}

/**
 * MongoDB validation error structure as returned by the server
 */
export type DocumentFailedValidation = {
  failingDocumentId?: string
  details?: {
    operatorName?: string
    schemaRulesNotSatisfied?: [
      {
        operatorName: string
        propertiesNotSatisfied: PropertiesNotSatisfied[]
      },
    ]
  }
}

/**
 * A simplified representation of MongoDB validation errors
 * Maps operator names to property details for easier client-side handling
 */
export type SimpleDocFailedValidation = Record<string, Record<string, PropertyDetail[]>[]>[] | undefined

/**
 * Transforms MongoDB validation error properties into a more readable format
 * @param propertiesNotSatisfied The properties that failed validation
 * @returns A mapped array of property errors with details
 * @internal
 */
const prettyPropertiesNotSatisfied = (propertiesNotSatisfied: readonly PropertiesNotSatisfied[]) =>
  propertiesNotSatisfied?.map(i => ({ [i.propertyName]: i.details }))

/**
 * Attempts to extract validation error details from a MongoDB server error
 * @param error The MongoDB server error to process
 * @returns A simplified representation of validation errors or undefined if not a validation error
 */
export function tryExtractSimpleDocFailedValidation(
  error: Readonly<MongoServerError>,
): SimpleDocFailedValidation | undefined {
  // Check if this is actually a MongoDB validation error
  if (!(error instanceof MongoServerError) || error.code !== 121) {
    return undefined
  }

  // Safely extract schema rules not satisfied
  const errInfo = error.errInfo as DocumentFailedValidation | undefined
  if (!errInfo?.details?.schemaRulesNotSatisfied?.length) {
    return undefined
  }

  const schemaRulesNotSatisfied = errInfo.details.schemaRulesNotSatisfied

  // Transform the schema rules into a more user-friendly format
  const result: SimpleDocFailedValidation = schemaRulesNotSatisfied.map(rule => ({
    [rule.operatorName]: prettyPropertiesNotSatisfied(rule.propertiesNotSatisfied || []),
  }))

  return result.length > 0 ? result : undefined
}

/**
 * Error class that simplifies handling of MongoDB validation errors
 * Extracts and provides easy access to validation details
 */
export class SimpleDocFailedValidationError extends Error {
  /** The extracted validation rules that weren't satisfied */
  schemaRulesNotSatisfied?: SimpleDocFailedValidation

  /** Flag indicating whether this is a document validation error */
  documentFailedValidation: boolean

  /**
   * Creates an instance from a MongoDB server error
   * @param mongoError The original MongoDB error
   */
  constructor(mongoError: Readonly<MongoServerError>) {
    super(mongoError.message, mongoError)
    this.schemaRulesNotSatisfied = tryExtractSimpleDocFailedValidation(mongoError)
    this.documentFailedValidation = this.schemaRulesNotSatisfied !== undefined
  }

  /**
   * Returns the validation rules that weren't satisfied as a JSON string
   * @returns A JSON string of the validation rules or undefined if not a validation error
   */
  schemaRulesNotSatisfiedAsString(): string | undefined {
    return this.documentFailedValidation ? JSON.stringify(this.schemaRulesNotSatisfied) : undefined
  }
}
