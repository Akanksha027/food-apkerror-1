import { AxiosError } from 'axios';

export interface CustomerServiceError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  actionRequired?: 'login' | 'refresh' | 'contact_support';
}

export function handleCustomerServiceError(error: unknown): CustomerServiceError {
  // Handle network errors
  if (error instanceof AxiosError && !error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      userMessage: 'Unable to connect to customer service. Please check your internet connection and try again.',
      retryable: true,
    };
  }

  // Handle HTTP errors
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    const data = error.response.data as { message?: string; error?: string } | undefined;
    const serverMessage = data?.message || data?.error || '';

    switch (status) {
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          userMessage: 'Please log in again to access customer support.',
          retryable: false,
          actionRequired: 'login',
        };

      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied',
          userMessage: 'You don\'t have permission to access this feature.',
          retryable: false,
        };

      case 404:
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          userMessage: 'The requested information could not be found.',
          retryable: false,
        };

      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          userMessage: 'You\'re sending requests too quickly. Please wait a moment and try again.',
          retryable: true,
        };

      case 500:
        if (serverMessage.toLowerCase().includes('cors')) {
          return {
            code: 'CORS_ERROR',
            message: 'CORS configuration issue',
            userMessage: 'Customer service is temporarily unavailable. Please try the mobile app or contact support.',
            retryable: false,
            actionRequired: 'contact_support',
          };
        }
        return {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
          userMessage: 'Customer service is experiencing issues. Please try again in a few minutes.',
          retryable: true,
        };

      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable',
          userMessage: 'Customer service is temporarily down for maintenance. Please try again shortly.',
          retryable: true,
        };

      default:
        return {
          code: 'HTTP_ERROR',
          message: serverMessage || `HTTP ${status} error`,
          userMessage: serverMessage || 'Something went wrong with customer service. Please try again.',
          retryable: true,
        };
    }
  }

  // Handle CSRF errors specifically
  if (error instanceof Error && error.message.toLowerCase().includes('csrf')) {
    return {
      code: 'CSRF_ERROR',
      message: 'Security token expired',
      userMessage: 'Your session has expired. Please refresh the page and try again.',
      retryable: true,
      actionRequired: 'refresh',
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      code: 'GENERIC_ERROR',
      message: error.message,
      userMessage: error.message.includes('timeout') 
        ? 'The request took too long. Please try again.'
        : 'An unexpected error occurred. Please try again.',
      retryable: true,
    };
  }

  // Fallback for unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error',
    userMessage: 'Something unexpected happened. Please try again or contact support.',
    retryable: true,
    actionRequired: 'contact_support',
  };
}

export function getRetryDelay(attemptCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  return Math.min(1000 * Math.pow(2, attemptCount), 30000);
}

export function shouldRetryError(error: CustomerServiceError, attemptCount: number): boolean {
  // Don't retry more than 3 times
  if (attemptCount >= 3) return false;
  
  // Don't retry non-retryable errors
  if (!error.retryable) return false;
  
  // Don't retry auth errors
  if (error.actionRequired === 'login') return false;
  
  return true;
}