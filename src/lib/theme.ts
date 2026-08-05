/**
 * Helpers de tema sem "use client" — usáveis no server (layout).
 * O componente interativo é ThemeToggle (client).
 */

/** Chave de localStorage (e nome do cookie espelho). */
export const THEME_STORAGE_KEY = "contech-theme";

/** Cookie espelho — sobrevive a reabertura quando localStorage falha ou some
 *  (webview/desktop, perfil limpo parcialmente, etc.). Path=/; não HttpOnly. */
export const THEME_COOKIE_NAME = "contech-theme";

export type Theme = "dark" | "light";

/** Aceita só light/dark; qualquer outra coisa vira dark (default do design system). */
export function parseTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

/**
 * Lê o cookie de tema de um header Cookie (server) ou de document.cookie (client).
 * Não lança — valor ausente/malformado → null.
 */
export function readThemeCookie(
  cookieHeaderOrDocumentCookie: string | null | undefined,
  name: string = THEME_COOKIE_NAME,
): Theme | null {
  if (!cookieHeaderOrDocumentCookie) return null;
  // split seguro: "a=1; contech-theme=light; b=2"
  const parts = cookieHeaderOrDocumentCookie.split(";");
  for (const raw of parts) {
    const i = raw.indexOf("=");
    if (i < 0) continue;
    const k = raw.slice(0, i).trim();
    if (k !== name) continue;
    const v = raw.slice(i + 1).trim();
    return parseTheme(decodeURIComponent(v));
  }
  return null;
}

/**
 * Atributo `data-theme` pro <html>: light → "light"; dark → undefined (default
 * do CSS é dark-mode-first — atributo AUSENTE = escuro).
 */
export function themeHtmlAttribute(theme: Theme): "light" | undefined {
  return theme === "light" ? "light" : undefined;
}

/**
 * Script anti-flash: aplica o tema salvo antes do primeiro paint. Injete no
 * <head> via <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />.
 *
 * Ordem de leitura: localStorage → cookie (espelho). Só "light" seta o atributo;
 * dark (ou ausente) deixa o default do CSS.
 */
export function themeInitScript(
  storageKey: string = THEME_STORAGE_KEY,
  cookieName: string = THEME_COOKIE_NAME,
): string {
  // String estática — sem input do usuário. Cookie parse mínimo no mesmo IIFE.
  return `(function(){try{var t=null;try{t=localStorage.getItem('${storageKey}')}catch(e){}if(t!=='light'&&t!=='dark'){var c=document.cookie||'';var p=c.split(';');for(var i=0;i<p.length;i++){var s=p[i],j=s.indexOf('=');if(j<0)continue;if(s.slice(0,j).trim()==='${cookieName}'){t=decodeURIComponent(s.slice(j+1).trim());break}}}if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}})()`;
}
