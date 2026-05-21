import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const githubPagesRepositoryName =
  process.env.GITHUB_REPOSITORY?.split('/').at(1) ?? 'athlete_dreams';
const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repositoryRoot,
  output: isGitHubPagesBuild ? 'export' : undefined,
  basePath: isGitHubPagesBuild ? `/${githubPagesRepositoryName}` : undefined,
  assetPrefix: isGitHubPagesBuild ? `/${githubPagesRepositoryName}/` : undefined,
  trailingSlash: isGitHubPagesBuild,
  images: {
    unoptimized: isGitHubPagesBuild,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.fad.network' },
    ],
  },
};

export default nextConfig;
