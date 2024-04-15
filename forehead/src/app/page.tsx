import {
  SimpleIconsFarcaster,
  SimpleIconsTelegram,
  SimpleIconsTwitter,
} from "@/app/components/Icons";
import { getFrameMetadata } from "frog/next";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import "./globals.css";
import "./Home.module.css";
import "./style.css";

export async function generateMetadata(): Promise<Metadata> {
  const frameTags = await getFrameMetadata(
    `${process.env.VERCEL_URL || "http://localhost:3000"}/api`,
  );
  return {
    other: frameTags,
  };
}
function App() {
  const minting = false;
  if (minting) {
    return (
      <div className="container h-[90%] text-center md:h-auto">
        <div className="meme-info mx-auto my-5">
          <img
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHFjdDIzZGF1Z3h1N2M2Y3A3Z3phd2x1d2RleGFsczg4eTY0djE2dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/eJEPRwpQMjGDmd6nvt/giphy.gif"
            alt="Meme"
            className="mx-auto"
          />
          <p className="description">
            This meme represents the spirit of the 90s internet culture.
          </p>
          <p className="donation">
            Donations go to: Digital Art Preservation Fund
          </p>
          <p className="mint-info">Minted: 150 times</p>
          <p className="total-raised">Total Raised: $3000</p>
          <button className="buy-button mx-auto my-5 block">Buy</button>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 transform">
          <button className="buy-button">Learn More</button>
        </div>
        <div className="absolute bottom-10 right-5">
          <button className="buy-button rounded-full">Random</button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="container h-[90%] text-center md:h-auto">
        <div className="meme-info mx-auto my-5">
          <h1 className="flex text-5xl font-bold">
            <div className="h-fit origin-center animate-spin">♻️</div>
            Welcome to Regen Games!
            <div className="h-fit origin-center animate-spin">♻️</div>
          </h1>
          <p className="description">
            Dive into games that not only entertain but also enrich our community and planet! 
            <br />
            🌍 More details coming soon - don't forget to join us on the <a href="https://warpcast.com/~/channel/greenpill" className="font-bold">/greenpill</a> channel and use 🟢
          </p>
          <div className="my-5 flex justify-center gap-4 underline">
            <Link
              href="https://twitter.com"
              className="link link-primary flex items-center gap-2 hidden"
            >
              <SimpleIconsTwitter />
              Twitter
            </Link>
            <a
              href="https://warpcast.com/~/channel/greenpill"
              className="link link-primary flex items-center gap-2"
            >
              <SimpleIconsFarcaster />
              Farcaster
            </a>
            <a
              href="https://t.me/+sMRGmwEvz9MxZDYx"
              className="link link-primary flex items-center gap-2"
            >
              <SimpleIconsTelegram />
              Telegram
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
