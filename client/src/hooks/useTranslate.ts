import { translations, type TranslationKey } from '../i18n/translations';

export const useTranslate = () => {
    return (key: TranslationKey) => translations[key] || key;
};