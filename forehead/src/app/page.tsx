"use client";

import "./globals.css";
import "./Home.module.css";
import "./style.css";

import React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function App() {
  const account = useAccount();
  const { status, error, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      <div className="container">
        <section className="hero-section">
          <h1>Revive the 90s in Digital Form</h1>
          <p>
            Join us in celebrating the golden era of memes with our exclusive
            NFT marketplace. Dive into nostalgia and own a piece of digital
            history.
          </p>
          <img src="https://place-hold.it/600x300.png" alt="90s Nostalgia" />
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <p>
            Our marketplace is a hub for creators and collectors alike, offering
            a platform to mint, buy, and trade NFTs that encapsulate the essence
            of the 90s.
          </p>
          <div className="about-images">
            <img src="https://place-hold.it/200x200.png" alt="Create NFT" />
            <img src="https://place-hold.it/200x200.png" alt="Buy NFT" />
            <img src="https://place-hold.it/200x200.png" alt="Trade NFT" />
          </div>
        </section>

        <section className="how-it-works-section">
          <h2>How It Works</h2>
          <p>
            Jumping into our marketplace is straightforward. Just connect your
            wallet to start exploring the vibrant world of 90s NFTs.
          </p>
          <ol>
            <li>Connect your wallet to get started.</li>
            <li>Add to your collection, create a meme, or mint a meme.</li>
            <li>
              Support your favorite meme coin by minting or purchasing NFTs.
            </li>
          </ol>
          <img src="https://place-hold.it/400x200.png" alt="How It Works" />
        </section>

        <section className="featured-nfts-section">
          <h2>Featured NFTs</h2>
          <div className="nft-gallery">
            <div className="nft-item">
              <img
                src="https://place-hold.it/200x200.png"
                alt="Featured Meme 1"
              />
              <p>Featured Meme 1</p>
              <button className="buy-button">Buy Now</button>
            </div>
            <div className="nft-item">
              <img
                src="https://place-hold.it/200x200.png"
                alt="Featured Meme 2"
              />
              <p>Featured Meme 2</p>
              <button className="buy-button">Buy Now</button>
            </div>
            <div className="nft-item">
              <img
                src="https://place-hold.it/200x200.png"
                alt="Featured Meme 3"
              />
              <p>Featured Meme 3</p>
              <button className="buy-button">Buy Now</button>
            </div>
            <div className="create-your-own">
              <button className="create-button">Create Your Own</button>
            </div>
          </div>
        </section>

        <footer className="footer-style">
          <p>
            Join us in preserving the spirit of the 90s through digital art.
            Every meme minted supports the creator and the meme's legacy.
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
