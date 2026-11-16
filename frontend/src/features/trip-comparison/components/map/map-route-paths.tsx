import type { Api } from 'common';
import { Fragment, useState } from 'react';

import { MapRoutePath } from '@/features/trip-comparison/components/map/map-route-path';
import MapRoutePathCallout from '@/features/trip-comparison/components/map/map-route-path-callout';
import { BestRouteBadge } from '@/features/trip-comparison/components/route-path-summary/route-path-summary-header';
import { useRoutePathCalloutPositions } from '@/features/trip-comparison/hooks/use-route-path-callout-positions';
import type { RouteOrder } from '@/features/trip-comparison/types/route';
import { createDrawnRoutes } from '@/features/trip-comparison/utils/drawn-route';
import { useLayerStack } from '@/hooks/map/use-layer-stack';
import { useIsPhone } from '@/hooks/use-is-phone';
import { createNestedId } from '@/utils/nested-id';

// The id a route's map sources and layers are nested under
const createRoutePathId = (routeId: string) => createNestedId('route', routeId);

interface MapRoutePathsProps {
    /** From the best to the worst by `order`. */
    routes: Api.Route[];
    order: RouteOrder;
    selectedRouteId: string | null;
    onSelect: (routeId: string | null) => void;
}

const MapRoutePaths = ({
    routes,
    order,
    selectedRouteId,
    onSelect,
}: MapRoutePathsProps) => {
    const toggle = (routeId: string) => {
        onSelect(selectedRouteId === routeId ? null : routeId);
    };

    const drawnRoutes = createDrawnRoutes(routes);

    const callouts = useRoutePathCalloutPositions(drawnRoutes);

    const routeStack = useLayerStack();

    // Raises the newly selected route, whatever selected it
    const [lastSelectedRouteId, setLastSelectedRouteId] = useState<
        string | null
    >(null);
    if (selectedRouteId !== lastSelectedRouteId) {
        setLastSelectedRouteId(selectedRouteId);
        if (selectedRouteId !== null) {
            routeStack.raise(createRoutePathId(selectedRouteId));
        }
    }

    const isPhone = useIsPhone();

    return routes.map((route, index) => {
        const drawnRoute = drawnRoutes.get(route.id);
        const calloutPosition = callouts.positions.get(route.id);
        if (!drawnRoute || !calloutPosition) {
            return null;
        }
        const pathId = createRoutePathId(route.id);
        const isBestRoute = index === 0;
        const isSelected = selectedRouteId === route.id;
        const isCalloutShown =
            // When a route is selected, the others' label is hidden
            (selectedRouteId === null || isSelected) &&
            // and all are when zoomed out too far
            !callouts.isZoomedOutTooFar;
        return (
            <Fragment key={route.id}>
                <MapRoutePath
                    id={pathId}
                    steps={drawnRoute.steps}
                    emphasis={
                        selectedRouteId === null
                            ? 'default'
                            : isSelected
                              ? 'selected'
                              : 'muted'
                    }
                    onClick={() => {
                        toggle(route.id);
                    }}
                    onPress={() => {
                        routeStack.raise(pathId);
                    }}
                />
                {isCalloutShown && (
                    <MapRoutePathCallout
                        position={calloutPosition}
                        steps={route.steps}
                        badge={isBestRoute && <BestRouteBadge order={order} />}
                        selected={isSelected}
                        // A card would cover too much of a phone's map
                        expanded={isSelected && !isPhone}
                        expandable={!isPhone}
                        stackOrder={routeStack.ids.indexOf(pathId) + 1}
                        onClick={() => {
                            toggle(route.id);
                        }}
                        onPress={() => {
                            routeStack.raise(pathId);
                        }}
                        onDrag={(draggedTo) => {
                            callouts.move(route.id, draggedTo);
                        }}
                        onDrop={(droppedAt) => {
                            callouts.drop(route.id, droppedAt);
                        }}
                    />
                )}
            </Fragment>
        );
    });
};

export default MapRoutePaths;
