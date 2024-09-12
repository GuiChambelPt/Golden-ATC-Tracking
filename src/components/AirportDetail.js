import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon } from 'ol/style';

const AirportDetail = ({ airports }) => {
  const { id } = useParams();
  const mapRef = useRef();
  const mapInstanceRef = useRef(null);
  const [showATCPlayer, setShowATCPlayer] = useState(false);
  const [nearbyFlights, setNearbyFlights] = useState([]);

  const airport = airports.find(a => a.id === id);

  useEffect(() => {
    if (!airport) return;

    const fetchNearbyFlights = async () => {
      try {
        const response = await fetch(`https://api.airplanes.live/v2/point/${airport.lat}/${airport.lon}/170`);
        const data = await response.json();
        setNearbyFlights(data.ac || []);
      } catch (error) {
        console.error('Error fetching nearby flights:', error);
      }
    };

    fetchNearbyFlights();
    const interval = setInterval(fetchNearbyFlights, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [airport]);

  useEffect(() => {
    if (!airport) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([airport.lon, airport.lat]),
        zoom: 10,
        maxZoom: 12,
        minZoom: 8
      })
    });

    // Lock the view to the airport
    map.getView().setCenter(fromLonLat([airport.lon, airport.lat]));

    // Add airport marker
    const airportFeature = new Feature({
      geometry: new Point(fromLonLat([airport.lon, airport.lat]))
    });

    const airportStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: 'https://openlayers.org/en/latest/examples/data/icon.png'
      })
    });

    airportFeature.setStyle(airportStyle);

    // Add flight markers
    const flightFeatures = nearbyFlights.map(flight => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([flight.lon, flight.lat]))
      });
      
      const flightStyle = new Style({
        image: new Icon({
          anchor: [0.5, 0.5],
          src: 'https://openlayers.org/en/latest/examples/data/airplane.png',
          rotation: (flight.track || 0) * Math.PI / 180 // Convert degrees to radians
        })
      });

      feature.setStyle(flightStyle);
      return feature;
    });

    const vectorSource = new VectorSource({
      features: [airportFeature, ...flightFeatures]
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    map.addLayer(vectorLayer);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(null);
      }
    };
  }, [airport, nearbyFlights]);

  const toggleATCPlayer = () => {
    setShowATCPlayer(!showATCPlayer);
  };

  if (!airport) {
    return <div>Airport not found</div>;
  }

  return (
    <div className="airport-detail">
      <h2>{airport.name} ({airport.id})</h2>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }}></div>
      <button onClick={toggleATCPlayer}>
        {showATCPlayer ? 'Hide ATC Audio' : 'Listen to ATC'}
      </button>
      {showATCPlayer && (
        <div className="atc-player">
          <audio controls autoPlay>
            <source src={airport.atcLink} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      <div>
        <h3>Nearby Flights</h3>
        <ul>
          {nearbyFlights.map(flight => (
            <li key={flight.hex}>
              {flight.flight || 'Unknown'} - Altitude: {flight.alt_baro || 'Unknown'} ft
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AirportDetail;