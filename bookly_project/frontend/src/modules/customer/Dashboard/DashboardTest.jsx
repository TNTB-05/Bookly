import { useState } from 'react';

export default function Dashboard() {
    const [searchResults, setSearchResults] = useState(null);
    const [geocodeResults, setGeocodeResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Test search with coordinates
    const searchWithCoordinates = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/search/nearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: 47.4979,
                    longitude: 19.0402,
                    radius_km: 50
                })
            });
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            setError('Search failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Test search with place name
    const searchWithPlace = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/search/nearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    place: 'Cegléd, Hungary',
                    radius_km: 70
                })
            });
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            setError('Search failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Test geocoding
    const testGeocode = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/search/geocode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    place: 'Brussel, Belgium'
                })
            });
            const data = await response.json();
            setGeocodeResults(data);
        } catch (err) {
            setError('Geocode failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Test search with service filter
    const searchWithServiceFilter = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/search/nearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    place: 'Budapest',
                    radius_km: 50,
                    service_name: 'haircut'
                })
            });
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            setError('Search failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Test search massage services
    const searchMassageServices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/search/nearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: 47.4979,
                    longitude: 19.0402,
                    radius_km: 50,
                    service_name: 'massage'
                })
            });
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            setError('Search failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Dashboard - Location Search Test</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={searchWithCoordinates}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px 20px' }}
                >
                    Search with Coordinates
                </button>
                <button
                    onClick={searchWithPlace}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px 20px' }}
                >
                    Search with Place Name
                </button>
                <button
                    onClick={testGeocode}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px 20px' }}
                >
                    Test Geocode (Brussels)
                </button>
                <br />
                <br />
                <button
                    onClick={searchWithServiceFilter}
                    disabled={loading}
                    style={{
                        marginRight: '10px',
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white'
                    }}
                >
                    Filter: Haircut Services
                </button>
                <button
                    onClick={searchMassageServices}
                    disabled={loading}
                    style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white' }}
                >
                    Filter: Massage Services
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Geocode Results */}
            {geocodeResults && (
                <div
                    style={{
                        marginBottom: '30px',
                        padding: '15px',
                        border: '1px solid #ccc',
                        borderRadius: '5px'
                    }}
                >
                    <h2>Geocode Results</h2>
                    <p>
                        <strong>Place:</strong> {geocodeResults.place}
                    </p>
                    <p>
                        <strong>Latitude:</strong> {geocodeResults.coordinates?.latitude}
                    </p>
                    <p>
                        <strong>Longitude:</strong> {geocodeResults.coordinates?.longitude}
                    </p>
                </div>
            )}

            {/* Search Results */}
            {searchResults && (
                <div>
                    <h2>Search Results</h2>
                    <div
                        style={{
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '5px'
                        }}
                    >
                        <p>
                            <strong>Search Location:</strong> Lat{' '}
                            {searchResults.search_location?.latitude}, Lon{' '}
                            {searchResults.search_location?.longitude}
                        </p>
                        <p>
                            <strong>Radius:</strong> {searchResults.radius_km} km
                        </p>
                        {searchResults.service_filter && (
                            <p>
                                <strong>Service Filter:</strong> {searchResults.service_filter}
                            </p>
                        )}
                        <p>
                            <strong>Results Found:</strong> {searchResults.results_count}
                        </p>
                    </div>

                    {searchResults.salons?.map((salon) => (
                        <div
                            key={salon.id}
                            style={{
                                marginBottom: '25px',
                                padding: '20px',
                                border: '2px solid #007bff',
                                borderRadius: '8px'
                            }}
                        >
                            <h3>
                                {salon.name}{' '}
                                <span style={{ color: '#666', fontSize: '16px' }}>
                                    ({salon.distance} km away)
                                </span>
                            </h3>
                            <p>
                                <strong>Address:</strong> {salon.address}
                            </p>
                            <p>
                                <strong>Phone:</strong> {salon.phone}
                            </p>
                            <p>
                                <strong>Email:</strong> {salon.email}
                            </p>
                            <p>
                                <strong>Status:</strong> {salon.status}
                            </p>
                            {salon.description && (
                                <p>
                                    <strong>Description:</strong> {salon.description}
                                </p>
                            )}

                            {/* Providers */}
                            {salon.providers && salon.providers.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    <h4>Providers ({salon.providers.length}):</h4>
                                    {salon.providers.map((provider) => (
                                        <div
                                            key={provider.id}
                                            style={{
                                                marginLeft: '20px',
                                                marginBottom: '10px',
                                                padding: '10px',
                                                backgroundColor: '#f9f9f9',
                                                borderRadius: '5px'
                                            }}
                                        >
                                            <p>
                                                <strong>{provider.name}</strong>{' '}
                                                {provider.isManager && (
                                                    <span style={{ color: '#28a745' }}>
                                                        (Manager)
                                                    </span>
                                                )}
                                            </p>
                                            <p>
                                                Email: {provider.email} | Phone: {provider.phone}
                                            </p>
                                            {provider.description && (
                                                <p style={{ fontSize: '14px' }}>
                                                    {provider.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Services */}
                            {salon.services && salon.services.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    <h4>Services ({salon.services.length}):</h4>
                                    {salon.services.map((service) => (
                                        <div
                                            key={service.id}
                                            style={{
                                                marginLeft: '20px',
                                                marginBottom: '10px',
                                                padding: '10px',
                                                backgroundColor: '#fff3cd',
                                                borderRadius: '5px'
                                            }}
                                        >
                                            <p>
                                                <strong>{service.name}</strong> - {service.price} Ft
                                            </p>
                                            <p>Duration: {service.duration_minutes} minutes</p>
                                            <p>Provider: {service.provider_name}</p>
                                            {service.description && (
                                                <p style={{ fontSize: '14px' }}>
                                                    {service.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {searchResults.results_count === 0 && (
                        <p style={{ color: '#999', fontSize: '18px' }}>
                            No salons found within the specified radius.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
