import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true, // Warning: This disables ESLint entirely during builds
	},
};

export default nextConfig;
