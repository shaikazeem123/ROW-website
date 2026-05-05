import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Trip } from '@/types/trip';
import { getLocationByName, BASE_LOCATION } from '@/data/locations';

// Fix for default marker icons in Leaflet with modern bundlers
// @ts-expect-error - Fix for default marker icons in Leaflet with modern bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface BusMapProps {
    trips: Trip[];
}

interface LocationPin {
    coords: [number, number];
    visits: number;
    trips: Trip[];
}

export function BusMap({ trips }: BusMapProps) {
    // Group trips by location to show single pin for multiple visits
    const locationPins = trips.reduce<Record<string, LocationPin>>((acc, trip) => {
        const locationData = getLocationByName(trip.location);
        if (locationData && locationData.coordinates) {
            if (!acc[trip.location]) {
                acc[trip.location] = {
                    coords: [locationData.coordinates.lat, locationData.coordinates.lng],
                    visits: 0,
                    trips: []
                };
            }
            acc[trip.location].visits++;
            acc[trip.location].trips.push(trip);
        }
        return acc;
    }, {});

    const center: [number, number] = [BASE_LOCATION.coordinates.lat, BASE_LOCATION.coordinates.lng];

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
            <MapContainer
                center={center}
                zoom={9}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Base Location Marker */}
                <Marker position={center} icon={redIcon}>
                    <Popup>
                        <div className="text-center font-medium">
                            <p>ROW Base Office</p>
                            <p className="text-xs text-text-muted">Bangalore</p>
                        </div>
                    </Popup>
                </Marker>

                {/* dynamic Trip Markers */}
                {Object.entries(locationPins).map(([name, data]) => (
                    <Marker key={name} position={data.coords}>
                        <Popup>
                            <div className="p-1">
                                <h4 className="font-bold text-primary">{name}</h4>
                                <p className="text-sm font-medium">{data.visits} visit(s) this period</p>
                                <div className="mt-2 text-xs space-y-1">
                                    {data.trips.slice(0, 3).map((t: Trip, i: number) => (
                                        <div key={i} className="border-t border-gray-100 pt-1">
                                            <span>{new Date(t.date).toLocaleDateString()}</span>
                                            <span className="ml-2 text-primary">{t.busNumber}</span>
                                        </div>
                                    ))}
                                    {data.trips.length > 3 && (
                                        <p className="text-primary italic mt-1">+ {data.trips.length - 3} more visits</p>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
