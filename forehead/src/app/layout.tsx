import bgStars from "@/public/gif/background-stars.gif";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React, { type ReactNode } from "react";
import { Bounce, ToastContainer } from "react-toastify";
import { Providers } from "./providers";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Regen Games",
  description: "Meme-coinery 🤝 public goods funding",
  openGraph: {
    title: "Regen Games",
    description: "Meme-coinery 🤝 public goods funding",
    type: "website",
  },
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          backgroundImage: `url(${bgStars.src})`,
          backgroundRepeat: "repeat",
        }}
      >
        <Providers>
          <div>
            {/*<Navbar />*/}
            {props.children}
            <ToastContainer
              position="bottom-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              transition={Bounce}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
