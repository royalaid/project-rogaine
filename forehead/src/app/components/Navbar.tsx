"use client";
import LogoMark from "@/public/logomark.svg";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

function NavbarItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const bg = isActive ? "bg-transparent" : "bg-gray-400";

  return (
    <Link
      href={href}
      className={`flex ${bg} h-full w-full items-center justify-center font-sans text-lg`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full">
      <div className="flex w-full items-center justify-between px-3 pb-1 pt-2">
        <Image src={LogoMark} alt={"Regen Games"} width={200} height={50} />
        <div className="right-0 md:right-10">
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
            {isOpen && (
              <div className="absolute right-0 top-full bg-white p-4 shadow-md">
                <ConnectKitButton />
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <ConnectKitButton />
          </div>
        </div>
      </div>
      <div className="w-full">
        <div className="flex h-20 items-center justify-evenly">
          <NavbarItem href={"/"}>Home</NavbarItem>
          <NavbarItem href={"/mint"}>Mint</NavbarItem>
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
