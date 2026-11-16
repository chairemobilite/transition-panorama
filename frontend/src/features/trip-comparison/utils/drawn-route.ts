import type { Icon } from '@phosphor-icons/react';
import type { Api } from 'common';
import type { LineString } from 'geojson';

import { sortRoutes } from '@/features/trip-comparison/utils/route';
import {
    createRouteStepGeometry,
    getRouteStepIcon,
    getRouteStepMode,
    isTravelRouteStep,
} from '@/features/trip-comparison/utils/route-step';
import { modeColors } from '@/utils/mode';

export interface RouteStepAppearance {
    icon: Icon;
    /** The theme variable of the step's color. */
    color: `--${string}`;
    /** Dash and gap lengths, in line widths. */
    dashArray: [number, number];
}

export interface DrawnRouteStep {
    /** Geometry as drawn, with its bend. */
    geometry: LineString;
    appearance: RouteStepAppearance;
}

export interface DrawnRoute {
    /** Its travel steps, in order. Stops aren't drawn. */
    steps: DrawnRouteStep[];
}

// From 0 for the fastest to 1 for the slowest
const findSlowness = (rank: number, count: number) =>
    count > 1 ? rank / (count - 1) : 0;

/**
 * Dashes a route by its rank, from the fastest (`0`) to the slowest
 */
const findRouteDashArray = (rank: number, count: number): [number, number] => {
    const slowness = findSlowness(rank, count);
    return [3 - 2.75 * slowness, 1 + slowness];
};

/**
 * Bends a route by its rank, from the fastest (`0`) to the slowest, to alternating sides
 */
const findRouteBend = (rank: number, count: number) => {
    const side = rank % 2 === 0 ? 1 : -1;
    // More curved when faster, so the fastest is the longest and stands out
    return side * (0.2 - 0.12 * findSlowness(rank, count));
};

/**
 * Creates how each route is drawn on the map, set apart from the others. Routes without steps
 * aren't drawn.
 *
 * @returns By route id, from the fastest route to the slowest.
 */
export const createDrawnRoutes = (
    routes: Api.Route[],
): ReadonlyMap<string, DrawnRoute> => {
    const sortedRoutes = sortRoutes(
        routes.filter((route) => route.steps.length > 0),
        // The dashes and bends hint at which routes are faster
        'travelTime',
    );
    return new Map(
        sortedRoutes.map((route, rank) => {
            const dashArray = findRouteDashArray(rank, sortedRoutes.length);
            const bend = findRouteBend(rank, sortedRoutes.length);
            const drawnRoute: DrawnRoute = {
                steps: route.steps.filter(isTravelRouteStep).map((step) => ({
                    geometry: createRouteStepGeometry(step, bend),
                    appearance: {
                        icon: getRouteStepIcon(step),
                        color: modeColors[getRouteStepMode(step)],
                        dashArray,
                    },
                })),
            };
            return [route.id, drawnRoute];
        }),
    );
};
