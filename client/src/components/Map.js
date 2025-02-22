import React, { useState, useCallback } from "react";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";
import mapStyles from "../config/mapStyles";

const Map = ({ center, zoom, serviceRange, isScrollable = true, className }) => {
    const [map, setMap] = useState(null);

    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);

        // If we are showing a service range, make sure it always fits
        if (center && serviceRange) {
            const bounds = new window.google.maps.LatLngBounds();
            const radiusInMeters = serviceRange * 1609.34;
            
            // Expands the bounds in all directions
            bounds.extend(new window.google.maps.LatLng(center.lat + radiusInMeters / 111320, center.lng));
            bounds.extend(new window.google.maps.LatLng(center.lat - radiusInMeters / 111320, center.lng));
            bounds.extend(new window.google.maps.LatLng(center.lat, center.lng + radiusInMeters / (111320 * Math.cos(center.lat * (Math.PI / 180)))));
            bounds.extend(new window.google.maps.LatLng(center.lat, center.lng - radiusInMeters / (111320 * Math.cos(center.lat * (Math.PI / 180)))));

            mapInstance.fitBounds(bounds);
        }
    }, [center, serviceRange]);

    // If center is not provided or invalid, set a default value
    const validCenter = center && center.lat && center.lng ? center : { lat: 40.7128, lng: -74.0060 };

    return (
        <div className={className}>
            <GoogleMap
                mapContainerStyle={{ height: "100%", width: "100%" }}
                center={validCenter}
                zoom={zoom}
                options={{
                    styles: mapStyles,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false,
                    keyboardShortcuts: false,
                    zoomControl: isScrollable,
                    draggable: isScrollable,
                    scrollwheel: isScrollable
                }}
                onLoad={onLoad}
              >
                <Marker position={validCenter} />

                {/* Circle representing the providers service range */}
                {serviceRange && (
                    <Circle
                          center={validCenter}
                          radius={serviceRange * 1609.34} // Convert miles to meters
                          options={{
                            strokeColor: "#1E90FF",
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: "#1E90FF",
                            fillOpacity: 0.2,
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default Map;