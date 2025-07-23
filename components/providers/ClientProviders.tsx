'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../../store';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <AccessibilityProvider>
          <ErrorBoundary>
            <AuthProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </ErrorBoundary>
        </AccessibilityProvider>
      </PersistGate>
    </Provider>
  );
}
