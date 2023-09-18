/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverActions: true,
    instrumentationHook: true,
    serverComponentsExternalPackages: ['knex', 'pg'],
  },
}

module.exports = nextConfig
