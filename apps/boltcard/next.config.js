/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['knex', 'pg'],
  },
}

module.exports = nextConfig
