import * as Utils from 'utils';
import type { z } from 'zod';

import { getApiV1Scenarios } from './generated/transitionAPI';
import * as TransitionSchema from './generated/transitionAPI.zod';

export type TransitionScenario = z.infer<
    typeof TransitionSchema.GetApiV1ScenariosResponseItem
>;

export const fetchTransitionScenarios = async (
    transitionUrl: string,
    token: string,
): Promise<TransitionScenario[]> => {
    const response = await Utils.fetchUpstream(() =>
        getApiV1Scenarios({
            transitionUrl,
            headers: { Authorization: `Bearer ${token}` },
        }),
    );
    if (response.status !== 200) {
        throw new Utils.HttpUpstreamError(response);
    }
    return Utils.parseUpstreamResponse(
        TransitionSchema.GetApiV1ScenariosResponse,
        response.data,
    );
};
