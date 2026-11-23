import { z } from 'zod';

// When a service we depend on fails, or answers unexpectedly
export class UpstreamError extends Error {}

// When the service answered with an HTTP error
export class HttpUpstreamError extends UpstreamError {
    readonly status: number;
    readonly data: unknown;

    constructor(response: { status: number; data: unknown }) {
        super(`HTTP ${response.status}`);
        this.status = response.status;
        this.data = response.data;
    }
}

// Any failure of the request itself, like an unreachable service, becomes an
// UpstreamError
export const fetchUpstream = async <T>(
    request: () => Promise<T>,
): Promise<T> => {
    try {
        return await request();
    } catch (error) {
        throw new UpstreamError('Request failed', { cause: error });
    }
};

export const parseUpstreamResponse = <T>(
    schema: z.core.$ZodType<T>,
    data: unknown,
): T => {
    const result = z.safeParse(schema, data);
    if (!result.success) {
        throw new UpstreamError('Unexpected answer', { cause: result.error });
    }
    return result.data;
};
