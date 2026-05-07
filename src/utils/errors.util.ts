import { BadRequestException, NotFoundException } from "@nestjs/common";

export function  getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	return 'unknown error';
}

export function handleErrors(error: unknown): string {
	if (error instanceof BadRequestException || error instanceof NotFoundException) {
		throw error;
	}
	const errMsg = getErrorMessage(error);
	return errMsg;
}