import { ASSETS_ICONS } from "@ruoyi/core/constant";

let icons: string[] = []
for (const path in ASSETS_ICONS) {
  const p = path.split('assets/icons/svg/')[1].split('.svg')[0];
  icons.push(p);
}

export default icons