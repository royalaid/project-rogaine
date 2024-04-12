import { getFrameMetadata } from "frog/next";
import type { Metadata } from "next";
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
  if(minting){
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
  } else{
    return (
      <div className="container text-center h-[90%] md:h-auto">
        <div className="meme-info mx-auto my-5">
          <h1 className="text-5xl font-bold">Welcome to Regen Games!</h1>
          <p className="description">Creating positive-sum games that give back to the community and environment.</p>
          <div className="flex justify-center gap-4 my-5">
            <a href="https://twitter.com" className="link link-primary">Twitter</a>
            <a href="https://facebook.com" className="link link-secondary">Facebook</a>
            <a href="https://instagram.com" className="link link-accent">Instagram</a>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
