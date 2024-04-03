/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/index.html',
        permanent: true,
      },
      {
        source: '/create',
        destination: '/create.html',
        permanent: true,
      },
      {
        source: '/mint',
        destination: '/mint.html',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
