declare module "*.jpg" {
  const content: string;
  export default content;
}
declare module "*.png" {
  const content: string;
  export default content;
}
declare module "*.svg" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
