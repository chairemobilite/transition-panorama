const parseBody = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

export interface TransitionRequestInit extends RequestInit {
    // Optional only because the generated client may leave out its options,
    // but every request needs it
    transitionUrl?: string;
}

// Used by the generated client instead of fetch.
// The default client parses every answer as JSON, but some of Transition's
// errors are plain text.
export const fetchTransition = async <T>(
    path: string,
    options: TransitionRequestInit,
): Promise<T> => {
    const { transitionUrl = '', ...init } = options;
    const response = await fetch(`${transitionUrl}${path}`, init);
    const text = await response.text();
    return {
        data: text === '' ? {} : parseBody(text),
        status: response.status,
        headers: response.headers,
    } as T;
};
