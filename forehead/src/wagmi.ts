import { http, createConfig } from 'wagmi'
import {base, mainnet, sepolia} from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

if(!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID){
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set")
}

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Create Wagmi' }),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || ''}),
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
})
