"use client";
import { ConnectKitButton } from "connectkit";
import React from "react";
import "./globals.css";
import "./style.css";

export default function Navbar() {
  return (
    <header
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      Welcome to the 90s NFT Marketplace
      <ConnectKitButton />
    </header>
    // <div className="flex flex-col">
    //   <div className="flex items-center justify-center gap-4 p-5 font-sans text-2xl text-blue-500 underline">
    //       <Link href={"/"}>Home</Link>
    //       <Link href={"/mint"}>Mint</Link>
    //     </div>
    //
    //     <div></div>
    //   </div>
  );
}
