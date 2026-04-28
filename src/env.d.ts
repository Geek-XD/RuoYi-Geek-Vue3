declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";


declare module "file-saver";
declare module "js-cookie";

declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<object, object, any>;
  export default component;
}

declare module '*.glsl' {
  const value: string;
  export default value;
}

declare module 'particles.vue3';
declare module 'jsencrypt/bin/jsencrypt.min' {
  class JSEncrypt {
    constructor();
    setPublicKey(pubkey: string): void;
    setPrivateKey(privkey: string): void;
    encrypt(str: string): string;
    decrypt(str: string): string;
  }
  export default JSEncrypt;
}

declare module '*.mjs' {
  const value: any;
  export default value;
}

declare module 'vite-plugin-qiankun/dist/helper' {
  export const qiankunWindow: Window & {
    __POWERED_BY_QIANKUN__?: boolean;
  };

  export function renderWithQiankun(lifecycles: {
    bootstrap?: (props?: unknown) => unknown;
    mount: (props?: unknown) => unknown;
    update?: (props?: unknown) => unknown;
    unmount: (props?: unknown) => unknown;
  }): void;
}

interface Window {
  __POWERED_BY_QIANKUN__?: boolean;
}