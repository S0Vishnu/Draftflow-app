import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    root: 'src/renderer',
    base: './',
    resolve: {
        alias: {
            '@renderer': resolve(__dirname, 'src/renderer/src')
        }
    },
    build: {
        outDir: '../../dist-web',
        emptyOutDir: true
    }
})
