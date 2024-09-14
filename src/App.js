import React, { useEffect, useState } from 'react';
import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import Select from 'ol/interaction/Select';
import { transform } from 'ol/proj';
import 'ol/ol.css'; // Import OpenLayers CSS
import './MapPage.css'; // Import your custom CSS
import { airports } from './data/airportsdata'; // Import airports data

const API_KEY = 'YOUR-API-KEY'; // Replace with your AirLabs API key

const MapPage = () => {
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [airportName, setAirportName] = useState('');
  const [airportInfo, setAirportInfo] = useState(null);

  useEffect(() => {
    // Create a vector source and layer for the markers
    const vectorSource = new VectorSource({
      features: airports.map(airport => {
        // Transform coordinates from EPSG:4326 to EPSG:3857 (Web Mercator)
        const coords = transform(airport.coordinates, 'EPSG:4326', 'EPSG:3857');
        return new Feature({
          geometry: new Point(coords),
          name: airport.name,
          radio: airport.radio,
          iata: airport.iata
        });
      })
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'https://cdn1.iconfinder.com/data/icons/location-9/49/airport-pin-512.png',
          scale: 0.1 // Scale the icon if needed
        })
      })
    });

    // Initialize the map
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: transform([-9.133832798, 38.771163582], 'EPSG:4326', 'EPSG:3857'), // Center on Lisbon Airport
        zoom: 10
      })
    });

    // Handle click events on features (markers)
    const selectInteraction = new Select({
      filter: (feature) => true // Select all features
    });
    map.addInteraction(selectInteraction);

    selectInteraction.on('select', async (event) => {
      const selectedFeature = event.selected[0];
      if (selectedFeature) {
        const name = selectedFeature.get('name');
        const radioUrl = selectedFeature.get('radio');
        const iata = selectedFeature.get('iata');
        
        setAirportName(name);
        setSelectedAirport(radioUrl);

        // Fetch additional airport info from AirLabs API
        try {
          const response = await fetch(`https://airlabs.co/api/v9/airports?iata_code=${iata}&api_key=${API_KEY}`);
          const data = await response.json();
          setAirportInfo(data.response[0]); // Assuming the response is an array
        } catch (error) {
          console.error('Error fetching airport data:', error);
          setAirportInfo(null);
        }
      } else {
        setAirportName('');
        setSelectedAirport(null);
        setAirportInfo(null);
      }
    });

    // Cleanup map instance on component unmount
    return () => {
      map.setTarget(null);
    };
  }, []);

  return (
    <div className="map-container">
      <header className="header-bar">
        <h1>Golden ATC Tracking</h1>
        <nav className="options-menu">
          <button>Option 1</button>
          <button>Option 2</button>
          <button>Option 3</button>
        </nav>
      </header>
      <div id="map" className="map"></div>
      {airportName && (
        <div className="info-box">
          <h2>{airportName}</h2>
          {airportInfo && (
            <div>
              <p><strong>City:</strong> {airportInfo.city}</p>
              <p><strong>Country:</strong> {airportInfo.country_name}</p>
              <p><strong>ICAO Code:</strong> {airportInfo.icao_code}</p>
              <p><strong>Latitude:</strong> {airportInfo.latitude}</p>
              <p><strong>Longitude:</strong> {airportInfo.longitude}</p>
            </div>
          )}
          {!airportInfo && <p>Loading airport details...</p>}
        </div>
      )}
      {selectedAirport && (
        <div className="radio-box">
          <p>Playing Radio:</p>
          <audio controls autoPlay>
            <source src={selectedAirport} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <p>Provided by <a href='https://www.liveatc.net/'>liveatc.net</a></p>
        </div>
      )}
    </div>
  );
};

export default MapPage;