'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {ConnectKitProvider} from "connectkit";
import React, { useState, type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'

import { config } from '@/wagmi'

export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
      <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
              <ConnectKitProvider>{props.children}</ConnectKitProvider>
          </QueryClientProvider>
      </WagmiProvider>
  )
}
