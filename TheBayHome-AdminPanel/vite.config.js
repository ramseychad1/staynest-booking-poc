import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const enableReactCompiler =
  process.env.REACT_COMPILER !== "0" && process.env.REACT_COMPILER !== "false";
const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || "localhost,127.0.0.1")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: enableReactCompiler
          ? [["babel-plugin-react-compiler", { target: "19" }]]
          : [],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: blob: http://localhost:3000 https://api.dicebear.com https://d3jxmneabzth3l.cloudfront.net https://d2om00vm7sdvbc.cloudfront.net; " +
        "font-src 'self' data: https://fonts.gstatic.com; " +
        "connect-src 'self' http://localhost:* ws://localhost:* https://api.thekeysvibe.com; " +
        "frame-src 'self' https://www.google.com https://maps.google.com;; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';",
    },
  },
  preview: { host: "0.0.0.0", port: 4173, allowedHosts },
});
