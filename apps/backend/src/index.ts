import express from 'express';
import { createGeocoder } from 'geocoder';
import * as Utils from 'utils';

import { TransitionClient } from '../../../packages/transition-client/src/transition-client';

import { createPlaceRouter } from './api/place';
import { createRouteRouter } from './api/route';
import { readConfig } from './config';
import { RouteFetcher } from './routing/routes/fetch-routes';
import { ScenarioIds } from './routing/routes/scenario-ids';
import { ApiError } from './utils/http';

const config = readConfig();
const app = express();
const geocoder = createGeocoder(
    config.private.geocoder.provider,
    config.private.geocoder.url,
);
const transition = await TransitionClient.create(
    config.private.transition.url,
    config.private.transition.credentials,
);
// Found at startup, so that a wrong name in the config stops the backend
const scenarioIds = new ScenarioIds(
    config.public.routingSetups,
    await transition.fetchScenarios(),
);
const routeFetcher = new RouteFetcher(
    scenarioIds,
    transition,
    config.public.transitionRouting,
    config.public.modesWithFullGeometry,
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use(createPlaceRouter(geocoder));
app.use(createRouteRouter(routeFetcher, config.public));

// Only ApiErrors are meant for the client: the details of the others stay in
// the logs
app.use(((error, _req, res, _next) => {
    if (error instanceof ApiError) {
        res.status(error.status).json(error.body);
        return;
    }
    console.error(error);
    res.sendStatus(error instanceof Utils.UpstreamError ? 502 : 500);
}) satisfies express.ErrorRequestHandler);

app.listen(config.private.port);
