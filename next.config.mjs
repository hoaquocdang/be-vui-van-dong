/** @type {import('next').NextConfig} */
const prod = process.env.NODE_ENV === 'production';
const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
const noStore = [{ key: 'Cache-Control', value: 'no-store' }];

export default {
  reactStrictMode: true,
  poweredByHeader: false,
  // mỗi lần build đổi số này → URL của file engine (?v=...) đổi theo nên có thể cache vĩnh viễn
  env: { NEXT_PUBLIC_BUILD: String(Date.now()) },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
      { source: '/models/:path*', headers: prod ? immutable : noStore },
      { source: '/vendor/:path*', headers: prod ? immutable : noStore },
      { source: '/engine/:path*', headers: prod ? immutable : noStore },
    ];
  },
};
