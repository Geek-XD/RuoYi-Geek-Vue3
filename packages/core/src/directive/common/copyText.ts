/**
* v-copyText 复制文本内容
* Copyright (c) 2026 Geek
* v-copyText="要复制的文本内容"
* v-copyText:callback="复制成功后的回调函数"
* 点击被标注的元素即可复制文本内容
*/

import type { Directive, DirectiveBinding } from "vue";
interface ElType extends HTMLElement {
  $copyValue: string;
  $copyCallback: Function;
  $destroyCopy: Function;
}
const vCopyText: Directive = {
  beforeMount(el: ElType, binding: DirectiveBinding) {
    if (binding.arg === "callback") {
      el.$copyCallback = binding.value;
    } else {
      el.$copyValue = binding.value;
      const handler = async () => {
        const isSuccess = await copyTextToClipboard(el.$copyValue);
        if (isSuccess && el.$copyCallback) {
          el.$copyCallback(el.$copyValue);
        }
      };
      el.addEventListener("click", handler);
      el.$destroyCopy = () => el.removeEventListener("click", handler);
    }
  }
}
export default vCopyText;

async function copyTextToClipboard(input: string) {
  try {
    await navigator.clipboard.writeText(input);
    return true;
  } catch {
    return false;
  }
}
