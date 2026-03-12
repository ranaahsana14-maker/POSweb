/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: "C:\\Users\\ranaa\\Music\\app1",
  },
}

module.exports = nextConfig