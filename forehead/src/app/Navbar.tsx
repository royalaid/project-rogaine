"use client";
import balloons from "@/public/gif/bounceballoons.gif";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Navbar() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center gap-4 p-5 font-sans text-2xl text-blue-500 underline">
        <Link href={"/"}>Home</Link>
        <Link href={"/mint"}>Mint</Link>
        <div className="ml-auto">
          <ConnectKitButton />
        </div>
      </div>

      <div></div>
      <Image
        className="mx-auto"
        src={balloons}
        alt="Balloons"
        width="467"
        height="43"
      />
    </div>
  );
}
