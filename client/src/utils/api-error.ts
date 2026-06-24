export const getApiErrorMessage = (errorResponse: unknown, fallback: string) => {
    if (
        typeof errorResponse === 'object' &&
        errorResponse !== null &&
        'data' in errorResponse
    ) {
        const responseData = errorResponse.data;

        if (
            typeof responseData === 'object' &&
            responseData !== null &&
            'message' in responseData &&
            typeof responseData.message === 'string'
        ) {
            return responseData.message;
        }
    }

    return fallback;
};