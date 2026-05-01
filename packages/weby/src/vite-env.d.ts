/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
}

declare module "*.glsl?raw" {
  const value: string;
  export default value;
}

declare module "*.vert?raw" {
  const value: string;
  export default value;
}

declare module "*.frag?raw" {
  const value: string;
  export default value;
}
