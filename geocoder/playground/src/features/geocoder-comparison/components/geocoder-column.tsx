import type { GeocoderConfig } from '../../../config/geocoder-configs';
import { usePlaceSearchQuery } from '../api/place-search';

interface GeocoderColumnProps {
    geocoderConfig: GeocoderConfig;
    text: string;
}

const GeocoderColumn = (props: GeocoderColumnProps) => {
    const { geocoderConfig, text } = props;
    const {
        data: places = [],
        error,
        isFetching,
    } = usePlaceSearchQuery(geocoderConfig, text);

    return (
        <section className="flex min-w-80 flex-1 flex-col gap-2">
            <h2 className="font-semibold">{geocoderConfig.name}</h2>
            {error ? (
                <p className="text-red-700">{error.message}</p>
            ) : (
                <ol
                    className={`flex list-decimal flex-col gap-1 pl-6 ${isFetching ? 'opacity-50' : ''}`}
                >
                    {places.map((place) => (
                        <li key={place.id}>{place.label}</li>
                    ))}
                </ol>
            )}
        </section>
    );
};

export default GeocoderColumn;
