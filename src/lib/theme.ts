/**
 * Helpers de tema sem "use client" — usáveis no server (layout).
 * O componente interativo é ThemeToggle (client).
 */

/** Chave de persistência padrão do tema. */
export const THEME_STORAGE_KEY = "contech-theme";

/**
 * Script anti-flash: aplica o tema salvo antes do primeiro paint. Injete no
 * <head> via <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />.
 */
export function themeInitScript(storageKey: string = THEME_STORAGE_KEY): string {
  return `(function(){try{if(localStorage.getItem('${storageKey}')==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`;
}
