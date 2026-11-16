import type { Icon } from '@phosphor-icons/react';
import type { Api } from 'common';
import type { LineString } from 'geojson';

import { sortRoutes } from '@/features/trip-comparison/utils/route';
import {
    createRouteStepGeometry,
    getRouteStepIcon,
    getRouteStepMode,
    isTravelRouteStep,
    type TravelRouteStep,
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

// How many times more than the others a step of each mode bends
const modeBendScales: Partial<Record<Api.Mode, number>> = {
    // So flights look like they leave the ground
    plane: 2.5,
};

/**
 * Bends a step by its mode, and by its route's rank, from the fastest (`0`) to the slowest, to
 * alternating sides
 */
const findRouteStepBend = (
    step: TravelRouteStep,
    rank: number,
    count: number,
) => {
    const side = rank % 2 === 0 ? 1 : -1;
    // More curved when faster, so the fastest is the longest and stands out
    const routeBend = 0.2 - 0.12 * findSlowness(rank, count);
    return side * routeBend * (modeBendScales[getRouteStepMode(step)] ?? 1);
};

// The same for steps of the same mode along the same line
const createRouteStepKey = (step: TravelRouteStep) => {
    const { coordinates } = step.geometry;
    // Assumes steps with the same mode, as many points, and the same start, middle and end are
    // the same line, rather than comparing every point, as roads can have thousands
    const points = [
        coordinates.at(0),
        coordinates.at(Math.floor(coordinates.length / 2)),
        coordinates.at(-1),
    ].map((position) =>
        position?.map((coordinate) => coordinate.toFixed(5)).join(','),
    );
    return [getRouteStepMode(step), coordinates.length, ...points].join(' ');
};

/**
 * Creates a function that gives a step's line as drawn. Steps along the same line are bent the same,
 * so they overlap.
 *
 * @param sortedRoutes - Each route's lines are bent by its place in this order. When several
 * routes share a line, it takes the bend of the first of them.
 */
const createStepGeometryFinder = (sortedRoutes: Api.Route[]) => {
    const geometryByStepKey = new Map<string, LineString>();
    sortedRoutes.forEach((route, rank) => {
        for (const step of route.steps.filter(isTravelRouteStep)) {
            const key = createRouteStepKey(step);
            if (!geometryByStepKey.has(key)) {
                const bend = findRouteStepBend(step, rank, sortedRoutes.length);
                geometryByStepKey.set(key, createRouteStepGeometry(step, bend));
            }
        }
    });
    return (step: TravelRouteStep) =>
        geometryByStepKey.get(createRouteStepKey(step)) ??
        // This fallback is never used, as every step was recorded, but TypeScript can't know it
        createRouteStepGeometry(step, 0);
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
    const findStepGeometry = createStepGeometryFinder(sortedRoutes);
    return new Map(
        sortedRoutes.map((route, rank) => {
            const dashArray = findRouteDashArray(rank, sortedRoutes.length);
            const drawnRoute: DrawnRoute = {
                steps: route.steps.filter(isTravelRouteStep).map((step) => ({
                    geometry: findStepGeometry(step),
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
