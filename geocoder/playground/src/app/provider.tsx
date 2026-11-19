import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider = (props: AppProviderProps) => {
    const { children } = props;
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};
