"use client";
import { ConnectKitButton } from "connectkit";
import React, { useState } from "react";
import "./globals.css";
import "./style.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}
    >
      <div style={{ flexGrow: 1, textAlign: "center" }}>
        ♻️ REGEN ♻️
      </div>
      <div className="absolute md:right-10 right-0">
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          {isOpen && (
            <div className="absolute top-full right-0 bg-white shadow-md p-4">
              <ConnectKitButton/>
            </div>
          )}
        </div>
        <div className="hidden md:block">
          <ConnectKitButton/>
        </div>
      </div>
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
