/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Comic Sans MS", "Fuzzy Bubbles", "cursive"],
      serif: ["Times New Roman", "Coustard", "serif"]
    },
    extend: {
      backgroundImage: {
        space: "url('https://assets.codepen.io/729148/spacebgani.gif')"
      }
    }
  },
  plugins: [],
}
