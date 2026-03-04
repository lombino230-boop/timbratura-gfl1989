import { useState, useCallback } from 'react';

export const useGeolocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getPosition = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const err = 'Geolocation is not supported by your browser';
                setError(err);
                reject(err);
                return;
            }

            setLoading(true);
            setError(null);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    };
                    setLoading(false);
                    resolve(coords);
                },
                (err) => {
                    let msg = 'Failed to get location';
                    if (err.code === 1) msg = 'Location permission denied';
                    else if (err.code === 2) msg = 'Location unavailable';
                    else if (err.code === 3) msg = 'Location timeout';

                    setLoading(false);
                    setError(msg);
                    reject(msg);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }, []);

    return { getPosition, loading, error };
};
