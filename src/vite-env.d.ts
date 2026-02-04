/// <reference types="vite/client" />

declare module "pako" {
  export function deflate(
    data: string | Uint8Array,
    options?: { to?: "string" }
  ): Uint8Array;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
