"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { movementTestnet } from "@/lib/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  if (!appId) {
    console.warn(
      "⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not set. Please add it to your .env.local file.\n" +
        "Get your App ID from https://dashboard.privy.io/\n" +
        "The app will work but authentication features will not be available."
    );
  }

  // Always mount PrivyProvider to prevent hook errors in child components
  // Use a placeholder if appId is missing - Privy will handle the error gracefully
  return (
    <PrivyProvider
      appId={appId || "placeholder-app-id"}
      config={{
        // Set Movement Mainnet as the default chain
        defaultChain: movementTestnet,
        // Support Movement Mainnet
        supportedChains: [movementTestnet],
        // Enable email authentication
        loginMethods: ["email", "google"],
        // Configure embedded wallets for Movement blockchain (EVM-compatible)
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        // Appearance configuration
        appearance: {
          theme: "dark",
          accentColor: "#3B82F6",
          logo: "https://your-logo-url.com/logo.png", // Optional
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </PrivyProvider>
  );
}
