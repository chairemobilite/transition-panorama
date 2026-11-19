import { geocoderConfigs } from '../../../config/geocoder-configs';

const GeocoderComparison = () => {
    return (
        <main className="flex gap-4 p-4">
            {geocoderConfigs.map((geocoderConfig) => (
                <section key={geocoderConfig.url} className="flex-1">
                    <h2 className="font-semibold">{geocoderConfig.name}</h2>
                </section>
            ))}
        </main>
    );
};

export default GeocoderComparison;
