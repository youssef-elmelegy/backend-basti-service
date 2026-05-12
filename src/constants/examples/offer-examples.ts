export const CREATE_OFFER_EXAMPLE = {
	name: 'Summer Sale',
	percentage: 15.5,
	startDate: '2024-06-01T00:00:00.000Z',
	expiryDate: '2024-08-31T23:59:59.000Z',
	isActive: true,
};

export const UPDATE_OFFER_EXAMPLE = {
	name: 'Summer Sale',
	percentage: 20,
	expiryDate: '2024-09-30T23:59:59.000Z',
};

export const TOGGLE_ITEM_OFFER_EXAMPLE = {
	offerId: '0c062498-fc5d-4b9a-8759-c7880f6d80aa',
	regionId: '0c062498-fc5d-4b9a-8759-c7880f6d80aa',
	addonId: '0c062498-fc5d-4b9a-8759-c7880f6d80aa',
};

export const OFFER_RESPONSE_EXAMPLE = {
	id: '0c062498-fc5d-4b9a-8759-c7880f6d80aa',
	name: 'Summer Sale',
	percentage: 15.5,
	startDate: '2024-06-01T00:00:00.000Z',
	expiryDate: '2024-08-31T23:59:59.000Z',
	isActive: true,
	createdAt: '2024-05-15T12:00:00.000Z',
	updatedAt: '2024-05-15T12:00:00.000Z',
};

export const OFFER_LIST_RESPONSE_EXAMPLE = [
	OFFER_RESPONSE_EXAMPLE,
];
