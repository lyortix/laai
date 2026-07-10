import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { tr } from "./dictionaries/tr";

export const dictionaries: Record<Locale, Dictionary> = { en, tr };

/** Current locale from the cookie set by the proxy / language switcher. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Dictionary for the current request's locale. */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
