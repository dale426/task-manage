import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

export default defineConfig({
  // 设置基础路径，确保资源路径正确
  base: './',
  plugins: [
    react(),
    // 自定义插件：复制favicon到dist根目录
    {
      name: 'copy-favicon',
      generateBundle() {
        const faviconSrc = path.resolve(__dirname, 'src/assets/favicon.ico');
        const faviconDest = path.resolve(__dirname, 'dist/favicon.ico');
        
        if (existsSync(faviconSrc)) {
          // 确保dist目录存在
          const distDir = path.dirname(faviconDest);
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
          }
          copyFileSync(faviconSrc, faviconDest);
          console.log('✓ favicon.ico copied to dist/');
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // 确保输出目录正确
    outDir: 'dist',
    // 确保资源文件名包含hash
    assetsDir: 'assets',
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
        },
        // 确保资源文件名正确
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 确保模块预加载正确
    modulePreload: {
      polyfill: false
    }
  },
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
  },
});



