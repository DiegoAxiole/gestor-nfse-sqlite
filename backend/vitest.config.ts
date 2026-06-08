import { defineConfig } from 'vitest/config'

import { config } from 'dotenv'

// Carrega .env antes dos testes
config({ path: '.env' })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    fileParallelism: false,
    exclude: ['node_modules', 'dist'],
  },
})
