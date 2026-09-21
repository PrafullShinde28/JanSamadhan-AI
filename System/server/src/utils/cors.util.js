/**
 * Helper to validate incoming origins for CORS in both Express and Socket.IO.
 * Supports:
 * - Specific configured CLIENT_URL
 * - Localhost / 127.0.0.1 on various dev ports (5173, 3000, etc.)
 * - Any local private network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
 * - Server-to-server / mobile native requests with no origin header
 */

const isOriginAllowed = (origin) => {
    if (!origin) return true;

    const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000"
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    // Allow any Netlify PWA, Render, and Cloudflare origins
    if (origin.endsWith(".netlify.app") || origin.endsWith(".onrender.com") || origin.endsWith(".trycloudflare.com")) {
        return true;
    }

    // Match IPv4 LAN formats (192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x) with any port
    const lanRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
    
    return lanRegex.test(origin);

};

module.exports = {
    isOriginAllowed
};
