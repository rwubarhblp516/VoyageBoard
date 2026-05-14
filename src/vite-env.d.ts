/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_AMAP_JS_API_KEY?: string
  readonly VITE_AMAP_SECURITY_JS_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
