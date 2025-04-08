import { MongoServerError } from 'mongodb'

// Detailed type definitions for MongoDB error structure
type ValidationDetail = {
  operatorName?: string
  reason?: string
  consideredValue?: unknown
  consideredType?: unknown
  specifiedAs?: Record<string, unknown>
}

type ValidationError = {
  propertyName: string
  details: ValidationDetail[]
}

type SchemaValidationError = {
  operatorName: string
  propertiesNotSatisfied: ValidationError[]
}

interface MongoErrorInfo {
  details: {
    schemaRulesNotSatisfied: SchemaValidationError[]
  }
}
// Define a type that matches the shape of MongoServerError
interface MongoErrorLike extends Error {
  code: number
  errInfo?: unknown
}

// Type guard for MongoServerError
export function isMongoServerError(error: unknown): error is MongoServerError {
  if (error instanceof MongoServerError) {
    return true
  }

  const isErrorInstance = error instanceof Error
  if (!isErrorInstance) {
    return false
  }

  const errorWithCode = error as Partial<MongoErrorLike>
  return typeof errorWithCode.code === 'number'
}

// Main error handling class
export class MongoValidationError extends Error {
  private validationDetails?: Record<string, ValidationDetail[]>[]

  constructor(error: Readonly<MongoServerError>) {
    super(error.message, { cause: error })

    if (this.isValidationError(error)) {
      this.validationDetails = this.extractValidationDetails(error)
    }
  }

  private isValidationError(error: MongoServerError): boolean {
    return error instanceof MongoServerError && error.code === 121
  }

  private extractValidationDetails(error: MongoServerError) {
    // Type guard to ensure error.errInfo is MongoErrorInfo
    if (!this.isMongoErrorInfo(error.errInfo)) {
      return
    }

    const schemaRules = error.errInfo.details.schemaRulesNotSatisfied
    if (!schemaRules?.length) {
      return
    }

    return schemaRules.map(rule => ({
      [rule.operatorName]: rule.propertiesNotSatisfied.map(prop => ({
        [prop.propertyName]: prop.details,
      })),
    }))
  }

  private isMongoErrorInfo(errInfo: unknown): errInfo is MongoErrorInfo {
    if (!errInfo || typeof errInfo !== 'object') return false

    const info = errInfo as Record<string, unknown>
    return (
      'details' in info &&
      typeof info.details === 'object' &&
      info.details !== null &&
      'schemaRulesNotSatisfied' in (info.details as Record<string, unknown>) &&
      Array.isArray((info.details as Record<string, unknown>).schemaRulesNotSatisfied)
    )
  }

  hasValidationErrors(): boolean {
    return !!this.validationDetails
  }

  getValidationDetails() {
    return this.validationDetails
  }
}
