import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next 16이 생성하는 AGENTS.md를 저장소에 넣지 않는다
  agentRules: false,
};

export default nextConfig;
