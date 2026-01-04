import { en } from './en';
import { roman } from './roman';
import { ur } from './ur';

export const translations = {
    en,
    ur,
    roman,
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof en; // This is a bit shallow, strictly we'd want deep keys
