import { Component } from "vue";

export const ASSETS_ICONS = import.meta.glob('/**/assets/icons/svg/*.svg');
export const VIEWS: Record<string, () => Promise<Component>> = import.meta.glob('/**/views/**/*.vue')
export const ROUTES: Record<string, any> = import.meta.glob('/**/routes/index.{ts,js}', { eager: true });