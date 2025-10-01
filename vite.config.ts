import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关库打包到单独的chunk
          'react-vendor': ['react', 'react-dom'],
          // 将Antd相关库打包到单独的chunk
          'antd-vendor': ['antd', '@ant-design/icons'],
          // 将路由相关库打包到单独的chunk
          'router-vendor': ['react-router-dom'],
          // 将状态管理相关库打包到单独的chunk
          'store-vendor': ['zustand'],
          // 将工具库打包到单独的chunk
          'utils-vendor': ['dayjs', 'nanoid']
        }
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
  },
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
  },
});



