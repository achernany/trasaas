/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy first-party hacia Supabase: el navegador solo habla con NUESTRO
    // dominio, inmune a firewalls corporativos que bloquean *.supabase.co
    return [
      {
        source: "/web-alfaco",
        destination: "/web-alfaco/index.html",
      },
      {
        source: "/sbproxy/:path*",
        destination: "https://udrlswivsjywttktevci.supabase.co/:path*",
      },
    ];
  },
};
export default nextConfig;
