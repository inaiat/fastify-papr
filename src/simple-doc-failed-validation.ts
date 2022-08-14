import {MongoServerError} from 'mongodb'

export type PropertyDetail = {
	operatorName?: string;
	specifiedAs?: Record<string, any>;
	reason?: string;
	consideredValue?: any;
	consideredType?: any;
}

export type PropertiesNotSatisfied = {
	propertyName: string;
	details: PropertyDetail[];
}

export type DocumentFailedValidation = {
	failingDocumentId?: string;
	details?: {
		operatorName?: string;
		schemaRulesNotSatisfied?: [
			{
				operatorName: string;
				propertiesNotSatisfied: PropertiesNotSatisfied[];
			},
		];
	};
}

export type SimpleDocFailedValidation = Array<Record<string, Array<Record<string, PropertyDetail[]>>>> | undefined

const prettyPropertiesNotSatisfied = (propertiesNotSatisfied: PropertiesNotSatisfied[]) =>
	propertiesNotSatisfied?.map(i => ({[i.propertyName]: i.details}))

export function tryExtractSimpleDocFailedValidation(error: MongoServerError): SimpleDocFailedValidation | undefined {
	if (error instanceof MongoServerError && error.code === 121) {
		const schemaRulesNotSatisfied = (error?.errInfo as DocumentFailedValidation)?.details?.schemaRulesNotSatisfied

		const result: SimpleDocFailedValidation = schemaRulesNotSatisfied?.map(i => ({
			[i.operatorName]: prettyPropertiesNotSatisfied(i.propertiesNotSatisfied),
		}))

		return result?.length === 0 ? undefined : result
	}

	return undefined
}

export class SimpleDocFailedValidationError extends Error {
	schemaRulesNotSatisfied?: SimpleDocFailedValidation
	documentFailedValidation: boolean

	constructor(mongoError: MongoServerError) {
		super(mongoError.message, mongoError)
		this.schemaRulesNotSatisfied = tryExtractSimpleDocFailedValidation(mongoError)
		this.documentFailedValidation = this.schemaRulesNotSatisfied !== undefined
	}

	schemaRulesNotSatisfiedAsString(): string | undefined {
		return this.documentFailedValidation ? JSON.stringify(this.schemaRulesNotSatisfied) : undefined
	}
}
