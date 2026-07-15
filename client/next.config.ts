import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const githubPagesRepositoryName =
  process.env.GITHUB_REPOSITORY?.split('/').at(1) ?? 'athlete_dreams';

/**
 * Build-mode contract:
 * - `pages`  — GitHub Pages export under a `/athlete_dreams` basePath (legacy `deploy-client-pages.yml`).
 * - `domain` — plain static export for the custom-domain S3/CloudFront deploy: `output: 'export'` with
 *   NO basePath/assetPrefix (served at the domain root). Never conflate with `pages`.
 * - `server` — default Next server build for local dev and `npm run ci`.
 */
type BuildMode = 'pages' | 'domain' | 'server';

const buildMode: BuildMode =
  process.env.GITHUB_PAGES === 'true'
    ? 'pages'
    : process.env.STATIC_EXPORT === 'true'
      ? 'domain'
      : 'server';

const isStaticExport = buildMode === 'pages' || buildMode === 'domain';
const isGitHubPagesBuild = buildMode === 'pages';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repositoryRoot,
  output: isStaticExport ? 'export' : undefined,
  basePath: isGitHubPagesBuild ? `/${githubPagesRepositoryName}` : undefined,
  assetPrefix: isGitHubPagesBuild ? `/${githubPagesRepositoryName}/` : undefined,
  trailingSlash: isGitHubPagesBuild,
  images: {
    unoptimized: isStaticExport,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.fad.network' },
    ],
  },
};

export default nextConfig;
