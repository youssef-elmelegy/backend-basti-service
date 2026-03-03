import { MOCK_DATA } from '../global.constants';

const MOCK_IDS = {
  paymentMethod: 'ff0e8400-e29b-41d4-a716-446655440030',
  paymentMethod2: 'ff0e8400-e29b-41d4-a716-446655440031',
  user: MOCK_DATA.id.user,
};

const paymentMethodItem = {
  id: MOCK_IDS.paymentMethod,
  type: 'credit_card',
  cardHolderName: 'Ahmed Hassan',
  cardLastFourDigits: '4242',
  cardExpiryMonth: 12,
  cardExpiryYear: 2025,
  isDefault: true,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

const paymentMethodItem2 = {
  id: MOCK_IDS.paymentMethod2,
  type: 'debit_card',
  cardHolderName: 'Ahmed Hassan',
  cardLastFourDigits: '1234',
  cardExpiryMonth: 6,
  cardExpiryYear: 2026,
  isDefault: false,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

const cashPaymentMethod = {
  id: 'ff0e8400-e29b-41d4-a716-446655440032',
  type: 'cash',
  cardHolderName: null,
  cardLastFourDigits: null,
  cardExpiryMonth: null,
  cardExpiryYear: null,
  isDefault: false,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

export const PaymentMethodExamples = {
  create: {
    request: {
      creditCard: {
        type: 'credit_card',
        cardHolderName: 'Ahmed Hassan',
        cardLastFourDigits: '4242',
        cardExpiryMonth: 12,
        cardExpiryYear: 2025,
        isDefault: true,
      },
      cash: {
        type: 'cash',
        isDefault: false,
      },
      wallet: {
        type: 'wallet',
        isDefault: false,
      },
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Payment method created successfully',
        data: paymentMethodItem,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Payment methods retrieved successfully',
        data: [paymentMethodItem, paymentMethodItem2, cashPaymentMethod],
        timestamp: MOCK_DATA.dates.default,
      },
      empty: {
        code: 200,
        success: true,
        message: 'Payment methods retrieved successfully',
        data: [],
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getById: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Payment method retrieved successfully',
        data: paymentMethodItem,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  update: {
    request: {
      cardHolderName: 'Ahmed M. Hassan',
      cardExpiryMonth: 11,
      cardExpiryYear: 2026,
      isDefault: true,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Payment method updated successfully',
        data: {
          ...paymentMethodItem,
          cardHolderName: 'Ahmed M. Hassan',
          cardExpiryMonth: 11,
          cardExpiryYear: 2026,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Payment method deleted successfully',
        data: { message: 'Payment method deleted successfully' },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
