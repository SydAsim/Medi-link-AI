"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeoLocation } from "@/types";

interface GeolocationState {
  location: GeoLocation | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(watch: boolean = false) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: "Geolocation is not supported by this browser",
        loading: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        },
        error: null,
        loading: false,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState({
        location: null,
        error: error.message,
        loading: false,
      });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        options
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch]);

  useEffect(() => {
    const cleanup = getLocation();
    return () => {
      if (cleanup) cleanup();
    };
  }, [getLocation]);

  return { ...state, refresh: getLocation };
}
