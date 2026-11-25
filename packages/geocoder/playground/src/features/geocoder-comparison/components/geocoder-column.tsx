import { useDebounce } from 'use-debounce';

import type { GeocoderConfig } from '../../../config/geocoder-configs';
import { usePlaceSearchQuery } from '../api/place-search';

import SearchResultItem from './search-result-item';

interface GeocoderColumnProps {
    geocoderConfig: GeocoderConfig;
    text: string;
    language: string;
}

const GeocoderColumn = (props: GeocoderColumnProps) => {
    const { geocoderConfig, text, language } = props;
    const throttleOptions = {
        leading: true,
        maxWait: geocoderConfig.throttleMs,
    };
    const [throttledText] = useDebounce(
        text,
        geocoderConfig.throttleMs,
        throttleOptions,
    );
    const [throttledLanguage] = useDebounce(
        language,
        geocoderConfig.throttleMs,
        throttleOptions,
    );
    const { data, error, isFetching } = usePlaceSearchQuery(
        geocoderConfig,
        throttledText,
        throttledLanguage,
    );

    return (
        <section className="flex min-w-80 flex-1 flex-col gap-2">
            <h2 className="font-semibold">{geocoderConfig.name}</h2>
            {error ? (
                <p className="text-red-700">{error.message}</p>
            ) : (
                <ol
                    className={`flex list-decimal flex-col gap-1 pl-6 ${isFetching ? 'opacity-50' : ''}`}
                >
                    {data?.results.map((result, index) => (
                        <SearchResultItem
                            key={`${index}-${result.place?.id ?? 'skipped'}`}
                            result={result}
                        />
                    ))}
                    {data?.placesWithoutRaw.map((place, index) => (
                        <li key={index} className="text-red-700">
                            {place.label} (Bug to investigate: no raw result has
                            this place&apos;s id)
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
};

export default GeocoderColumn;
