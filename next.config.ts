import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  rules: {
    "no-console": "off", // Example of disabling the 'no-console' rule
    "react/no-unescaped-entities": "off", // Another example of disabling a rule
  },
};

export default nextConfig;
