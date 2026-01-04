import { translations } from '@/constants/translations';
import { useApp } from '@/contexts/AppContext';

export function useTranslation() {
    const { language } = useApp();

    const t = (key: string): string => {
        const keys = key.split('.');

        // Try to find the value in the selected language
        let value: any = translations[language];
        let found = true;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                found = false;
                break;
            }
        }

        if (found && typeof value === 'string') {
            return value;
        }

        // Fallback to English if not found or if value is not a string
        let fallbackValue: any = translations['en'];
        for (const k of keys) {
            if (fallbackValue && typeof fallbackValue === 'object' && k in fallbackValue) {
                fallbackValue = fallbackValue[k];
            } else {
                return key; // Return key if not found in fallback either
            }
        }

        return typeof fallbackValue === 'string' ? fallbackValue : key;
    };

    return { t, language };
}
