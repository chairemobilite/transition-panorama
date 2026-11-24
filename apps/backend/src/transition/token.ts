import * as Utils from 'utils';

import { postToken } from './generated/transitionAPI';

export interface TransitionCredentials {
    userName: string;
    password: string;
}

export const fetchTransitionToken = async (
    transitionUrl: string,
    credentials: TransitionCredentials,
): Promise<string> => {
    const response = await postToken(
        {
            usernameOrEmail: credentials.userName,
            password: credentials.password,
        },
        { transitionUrl },
    );
    if (response.status !== 200) {
        throw new Utils.HttpUpstreamError(response);
    }
    return response.data;
};
