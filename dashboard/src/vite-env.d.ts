/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_DEV_TOOLS: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_BUILD_ANALYZE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}