// src/index.tsx or App.tsx in the Main Microfrontend
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Login from "login/Login"; // Assuming the Login component is exposed by the Login Microfrontend
import { UserProvider, useUser } from "login/UserStorage"; // Import UserProvider from Login microfrontend
import Shops from "listing/Shops"; // Import UserProvider from Login microfrontend
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

const App = () => {
  const { user } = useUser();

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        {!user && <Login />}
        {user && <Shops />}
      </QueryClientProvider>
    </div>
  );
};

const rootElement = document.getElementById('app');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
  <UserProvider>
    <App />
  </UserProvider>
);
