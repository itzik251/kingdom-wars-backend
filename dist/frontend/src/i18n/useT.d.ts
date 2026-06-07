import { Lang } from './translations';
interface LangStore {
    lang: Lang;
    setLang: (lang: Lang) => void;
}
export declare const useLangStore: import("zustand").UseBoundStore<import("zustand").StoreApi<LangStore>>;
export declare function useT(): (key: string, vars?: Record<string, string | number>) => string;
export {};
