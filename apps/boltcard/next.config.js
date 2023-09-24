/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions: true,
    instrumentationHook: true,
    serverComponentsExternalPackages: ['knex', 'pg'],
    serverActions: true,
  },
}

module.exports = nextConfig
