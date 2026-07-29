import { createContext, useContext, ReactNode } from 'react';
import { useCustomerServiceHealth, useCustomerProfile } from './hooks';

interface CustomerServiceContextType {
  isServiceHealthy: boolean;
  customerProfile: any;
  isProfileLoading: boolean;
}

const CustomerServiceContext = createContext<CustomerServiceContextType | null>(null);

interface Props {
  children: ReactNode;
}

export function CustomerServiceProvider({ children }: Props) {
  const { data: isServiceHealthy = false } = useCustomerServiceHealth();
  const { data: customerProfile, isLoading: isProfileLoading } = useCustomerProfile();

  const value = {
    isServiceHealthy,
    customerProfile,
    isProfileLoading,
  };

  return (
    <CustomerServiceContext.Provider value={value}>
      {children}
    </CustomerServiceContext.Provider>
  );
}

export function useCustomerService() {
  const context = useContext(CustomerServiceContext);
  if (!context) {
    throw new Error('useCustomerService must be used within CustomerServiceProvider');
  }
  return context;
}