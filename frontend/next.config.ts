import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/borrow',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
