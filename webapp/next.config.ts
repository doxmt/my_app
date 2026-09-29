import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 레포 루트에도 package-lock.json이 있어 workspace root를 잘못 추론하지 않도록 webapp/으로 고정한다.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
