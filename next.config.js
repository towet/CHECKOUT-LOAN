/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PESAPAL_CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY,
    PESAPAL_CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET,
    SITE_URL: process.env.SITE_URL,
  },
}

module.exports = nextConfig
