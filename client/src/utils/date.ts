export const formatDate = (value: string | null | undefined, fallback = 'N/A') => {
    if (!value) {
        return fallback;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return fallback;
    }

    return date.toLocaleDateString();
};