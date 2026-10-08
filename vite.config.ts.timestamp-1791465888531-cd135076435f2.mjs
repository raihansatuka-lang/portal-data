// vite.config.ts
import { defineConfig } from "file:///D:/laragon/www/portal-pemetaan/portal-data/node_modules/vite/dist/node/index.js";
import react from "file:///D:/laragon/www/portal-pemetaan/portal-data/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///D:/laragon/www/portal-pemetaan/portal-data/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "D:\\laragon\\www\\portal-pemetaan\\portal-data";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Naikkan limit warning chunk (default 500 kB terlalu rendah untuk leaflet)
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        // ── Manual chunk splitting ──────────────────────────────────────────
        // Memecah bundle besar menjadi potongan-potongan kecil yang bisa
        // di-cache browser secara terpisah. Saat kode app berubah, library
        // chunk (leaflet, recharts, dll) tidak perlu didownload ulang.
        manualChunks: (id) => {
          if (id.includes("leaflet") || id.includes("react-leaflet")) {
            return "vendor-leaflet";
          }
          if (id.includes("recharts") || id.includes("chart.js") || id.includes("react-chartjs-2") || id.includes("react-apexcharts") || id.includes("apexcharts")) {
            return "vendor-charts";
          }
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules")) {
            return "vendor-misc";
          }
        }
      }
    }
  },
  // ── Optimasi dev server ──────────────────────────────────────────────────
  // Pre-bundle dependensi besar saat pertama kali dev server jalan
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "leaflet",
      "react-leaflet",
      "axios"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxwb3J0YWwtcGVtZXRhYW5cXFxccG9ydGFsLWRhdGFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGxhcmFnb25cXFxcd3d3XFxcXHBvcnRhbC1wZW1ldGFhblxcXFxwb3J0YWwtZGF0YVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovbGFyYWdvbi93d3cvcG9ydGFsLXBlbWV0YWFuL3BvcnRhbC1kYXRhL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcblxyXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXHJcblxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIGJ1aWxkOiB7XHJcbiAgICAvLyBOYWlra2FuIGxpbWl0IHdhcm5pbmcgY2h1bmsgKGRlZmF1bHQgNTAwIGtCIHRlcmxhbHUgcmVuZGFoIHVudHVrIGxlYWZsZXQpXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcblxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBcdTI1MDBcdTI1MDAgTWFudWFsIGNodW5rIHNwbGl0dGluZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICAvLyBNZW1lY2FoIGJ1bmRsZSBiZXNhciBtZW5qYWRpIHBvdG9uZ2FuLXBvdG9uZ2FuIGtlY2lsIHlhbmcgYmlzYVxyXG4gICAgICAgIC8vIGRpLWNhY2hlIGJyb3dzZXIgc2VjYXJhIHRlcnBpc2FoLiBTYWF0IGtvZGUgYXBwIGJlcnViYWgsIGxpYnJhcnlcclxuICAgICAgICAvLyBjaHVuayAobGVhZmxldCwgcmVjaGFydHMsIGRsbCkgdGlkYWsgcGVybHUgZGlkb3dubG9hZCB1bGFuZy5cclxuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xyXG4gICAgICAgICAgLy8gMS4gTGVhZmxldCArIHJlYWN0LWxlYWZsZXQgXHUyMTkyIGNodW5rIHRlcnBpc2FoIChiZXNhciwgamFyYW5nIGJlcnViYWgpXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2xlYWZsZXQnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtbGVhZmxldCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLWxlYWZsZXQnXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gMi4gQ2hhcnQgbGlicmFyaWVzIChjaGFydC5qcywgcmVjaGFydHMsIGFwZXhjaGFydHMpIFx1MjE5MiAxIGNodW5rXHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdyZWNoYXJ0cycpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdjaGFydC5qcycpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdyZWFjdC1jaGFydGpzLTInKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygncmVhY3QtYXBleGNoYXJ0cycpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdhcGV4Y2hhcnRzJylcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1jaGFydHMnXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gMy4gRnJhbWVyIE1vdGlvbiBcdTIxOTIgY2h1bmsgdGVycGlzYWggKGJlc2FyLCBhbmltYXNpKVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdmcmFtZXItbW90aW9uJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItbW90aW9uJ1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIDUuIFNlbXVhIG5vZGVfbW9kdWxlcyBsYWluIFx1MjE5MiB2ZW5kb3ItbWlzY1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1taXNjJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIFx1MjUwMFx1MjUwMCBPcHRpbWFzaSBkZXYgc2VydmVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gIC8vIFByZS1idW5kbGUgZGVwZW5kZW5zaSBiZXNhciBzYWF0IHBlcnRhbWEga2FsaSBkZXYgc2VydmVyIGphbGFuXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdyZWFjdCcsXHJcbiAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICdsZWFmbGV0JyxcclxuICAgICAgJ3JlYWN0LWxlYWZsZXQnLFxyXG4gICAgICAnYXhpb3MnLFxyXG4gICAgXSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBULFNBQVMsb0JBQW9CO0FBQ3ZWLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUVoQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFFQSxPQUFPO0FBQUE7QUFBQSxJQUVMLHVCQUF1QjtBQUFBLElBRXZCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBS04sY0FBYyxDQUFDLE9BQU87QUFFcEIsY0FBSSxHQUFHLFNBQVMsU0FBUyxLQUFLLEdBQUcsU0FBUyxlQUFlLEdBQUc7QUFDMUQsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FDRSxHQUFHLFNBQVMsVUFBVSxLQUN0QixHQUFHLFNBQVMsVUFBVSxLQUN0QixHQUFHLFNBQVMsaUJBQWlCLEtBQzdCLEdBQUcsU0FBUyxrQkFBa0IsS0FDOUIsR0FBRyxTQUFTLFlBQVksR0FDeEI7QUFDQSxtQkFBTztBQUFBLFVBQ1Q7QUFHQSxjQUFJLEdBQUcsU0FBUyxlQUFlLEdBQUc7QUFDaEMsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUEsRUFJQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
