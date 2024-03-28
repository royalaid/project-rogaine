'use client'

import {Web3Provider} from "@/app/Web3Provider";
import {ConnectKitButton} from "connectkit";
import React from "react";
import { useAccount, useConnect, useDisconnect } from 'wagmi'

function App() {
  const account = useAccount()
  const { status, error } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <>
      <div className="font-sans">

          <h2 className="font-bold text-6xl">Account</h2>

        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === 'connected' && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
          <ConnectKitButton />
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
    </>
  )
}

function ContextWrapper() {
  return(
      <Web3Provider>
        <App />
      </Web3Provider>
  )
}


export default ContextWrapper
