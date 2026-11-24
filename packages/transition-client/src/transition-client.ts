import * as Utils from 'utils';

import {
    postTransitionRoute,
    type TransitionRouteBody,
    type TransitionRouteResponse,
} from './route';
import { fetchTransitionScenarios, type TransitionScenario } from './scenarios';
import { fetchTransitionToken, type TransitionCredentials } from './token';

const checkIsUnauthorized = (error: unknown) => {
    return error instanceof Utils.HttpUpstreamError && error.status === 401;
};

// Transition's tokens expire, and become invalid when it restarts, without
// saying when: requests refused with a 401 log in again, and are retried once
export class TransitionClient {
    private renewal: Promise<void> | undefined;

    private constructor(
        private readonly url: string,
        private readonly credentials: TransitionCredentials,
        private token: string,
    ) {}

    static async create(
        url: string,
        credentials: TransitionCredentials,
    ): Promise<TransitionClient> {
        return new TransitionClient(
            url,
            credentials,
            await fetchTransitionToken(url, credentials),
        );
    }

    postRoute(body: TransitionRouteBody): Promise<TransitionRouteResponse> {
        return this.requestWithToken((token) =>
            postTransitionRoute(this.url, token, body),
        );
    }

    fetchScenarios(): Promise<TransitionScenario[]> {
        return this.requestWithToken((token) =>
            fetchTransitionScenarios(this.url, token),
        );
    }

    private async requestWithToken<T>(
        request: (token: string) => Promise<T>,
    ): Promise<T> {
        const token = this.token;
        try {
            return await request(token);
        } catch (error) {
            if (!checkIsUnauthorized(error)) {
                throw error;
            }
            await this.renewToken(token);
            return request(this.token);
        }
    }

    // Requests refused at the same time share a single login
    private async renewToken(refusedToken: string) {
        if (this.token !== refusedToken) {
            return;
        }
        this.renewal ??= fetchTransitionToken(this.url, this.credentials)
            .then((token) => {
                this.token = token;
            })
            .finally(() => {
                this.renewal = undefined;
            });
        await this.renewal;
    }
}
