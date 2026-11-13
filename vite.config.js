import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";

const projectRoot = process.cwd();
const pages = ["index", "about", "blog", "contact", "fellowship", "publications", "research"];

function legacyPages() {
  return {
    name: "georbit-legacy-pages",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url || "/", "http://localhost").pathname;
        const pageMatch = pathname.match(/^\/legacy\/([a-z-]+)\.html$/);
        if (pageMatch && pages.includes(pageMatch[1])) {
          response.setHeader("content-type", "text/html; charset=utf-8");
          response.end(readFileSync(resolve(projectRoot, `${pageMatch[1]}.html`)));
          return;
        }
        const assetMatch = pathname.match(/^\/assets\/(.+)$/);
        if (assetMatch) {
          const assetPath = resolve(projectRoot, "assets", assetMatch[1]);
          if (assetPath.startsWith(resolve(projectRoot, "assets") + sep) && existsSync(assetPath)) {
            const types = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp" };
            response.setHeader("content-type", types[extname(assetPath)] || "application/octet-stream");
            response.end(readFileSync(assetPath));
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      const output = resolve(projectRoot, "dist");
      const legacyOutput = resolve(output, "legacy");
      mkdirSync(legacyOutput, { recursive: true });
      for (const page of pages) copyFileSync(resolve(projectRoot, `${page}.html`), resolve(legacyOutput, `${page}.html`));
      copyFileSync(resolve(projectRoot, "inbox.html"), resolve(output, "inbox.html"));
      cpSync(resolve(projectRoot, "assets"), resolve(output, "assets"), { recursive: true });
    }
  };
}

export default defineConfig({
  root: resolve(projectRoot, "client"),
  publicDir: "public",
  plugins: [react(), legacyPages()],
  build: { outDir: resolve(projectRoot, "dist"), emptyOutDir: true }
});
