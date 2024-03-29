"use client";

import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Image from "next/image";
import balloons from "@/public/gif/bounceballoons.gif";

function App() {
  const account = useAccount();
  const { status, error, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div style={{ background: 'lime', fontFamily: 'Comic Sans MS', color: 'magenta', padding: '20px' }}>
      <Image
        className="mx-auto"
        src={balloons}
        alt="Balloons"
        width="467"
        height="43"
      />
      <marquee><h1 style={{ fontSize: '40px', fontWeight: 'bold', textDecoration: 'underline blink' }}>Welcome to My Account Page!</h1></marquee>

      <table border="1" cellpadding="5" cellspacing="0" style={{ margin: 'auto', background: 'cyan' }}>
        <tr>
          <td>Status:</td>
          <td>{account.status}</td>
        </tr>
        <tr>
          <td>Addresses:</td>
          <td>{JSON.stringify(account.addresses)}</td>
        </tr>
        <tr>
          <td>Chain ID:</td>
          <td>{account.chainId}</td>
        </tr>
      </table>

      {account.status === "connected" && (
        <center>
          <button style={{ marginTop: '20px', background: 'yellow', fontSize: '20px', cursor: 'pointer' }} onClick={() => disconnect()}>
            Disconnect
          </button>
        </center>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <div style={{ marginTop: '10px' }}>{status}</div>
        <div style={{ color: 'blue' }}>{error?.message}</div>
      </div>

    <div style={{ marginTop: '50px', textAlign: 'center', fontFamily: 'Courier New', background: 'pink', padding: '20px' }}>
      <h2 style={{ textDecoration: 'blink' }}>Memes for Sale!</h2>
      <table border="2" cellpadding="5" cellspacing="3" style={{ margin: 'auto', background: 'lightyellow' }}>
        <tr>
          <th>Image</th>
          <th>Action</th>
        </tr>
        <tr>
          <td>
            <Image
              src="https://place-hold.it/200x200.png"
              alt="Funny Meme"
              width="200"
              height="200"
            />
          </td>
          <td>
            <button style={{ background: 'lightgreen', cursor: 'pointer' }}>Buy Now</button>
          </td>
        </tr>
        <tr>
          <td>
            <Image
              src="https://place-hold.it/200x200.png"
              alt="Hilarious Meme"
              width="200"
              height="200"
            />
          </td>
          <td>
            <button style={{ background: 'lightgreen', cursor: 'pointer' }}>Buy Now</button>
          </td>
        </tr>
        <tr>
          <td>
            <Image
              src="https://place-hold.it/200x200.png"
              alt="LOL Meme"
              width="200"
              height="200"
            />
          </td>
          <td>
            <button style={{ background: 'lightgreen', cursor: 'pointer' }}>Buy Now</button>
          </td>
        </tr>
      </table>
      <p style={{ marginTop: '20px' }}>All memes created by <span style={{ fontWeight: 'bold' }}>0x1234</span></p>
    </div>
    </div>
  );
}

export default App;
