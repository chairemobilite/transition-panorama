import GeocoderComparison from '../features/geocoder-comparison/components/geocoder-comparison';

import { AppProvider } from './provider';

const App = () => {
    return (
        <AppProvider>
            <GeocoderComparison />
        </AppProvider>
    );
};

export default App;
