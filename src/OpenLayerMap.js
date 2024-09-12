// OpenLayerMap.js
import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Icon } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import axios from 'axios';
import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';
import Overlay from 'ol/Overlay';
import { useLocation } from 'react-router-dom';
import AudioPlayer from './AudioPlayer'; // Import the AudioPlayer component

const OpenLayerMap = () => {
  const mapElement = useRef();
  const [planes, setPlanes] = useState([]);
  const [showPlayer, setShowPlayer] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const location = useLocation();

  // Get latitude, longitude, and radio URL from URL parameters
  const query = new URLSearchParams(location.search);
  const lat = parseFloat(query.get('lat'));
  const lon = parseFloat(query.get('lon'));
  const radioUrl = query.get('radio');

  useEffect(() => {
    // Fetch real-time plane data from the Airplanes Live API
    const fetchPlanes = async () => {
      try {
        const response = await axios.get(
          `https://api.airplanes.live/v2/point/${lat}/${lon}/250`
        );

        if (response && response.data && response.data.ac) {
          const planesData = response.data.ac.map((plane) => ({
            id: plane.hex,
            longitude: plane.lon,
            latitude: plane.lat,
            altitude: plane.alt_baro,
            speed: plane.gs,
            callsign: plane.r || plane.flight,
            type: plane.t,
            desc: plane.desc,
          }));
          setPlanes(planesData);
        } else {
          console.error('No plane data found.');
        }
      } catch (error) {
        console.error('Error fetching plane data:', error);
      }
    };

    const interval = setInterval(fetchPlanes, 10000);
    fetchPlanes();

    return () => clearInterval(interval);
  }, [lat, lon]);

  useEffect(() => {
    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([lon, lat]),
        zoom: 10,
        minZoom: 5,
        maxZoom: 18,
      }),
    });

    const vectorSource = new VectorSource();

    planes.forEach((plane) => {
      if (plane.latitude && plane.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([plane.longitude, plane.latitude])),
          name: plane.callsign || plane.type,
          info: `Callsign: ${plane.callsign || 'N/A'}<br>Description: ${plane.desc || 'N/A'}<br>Altitude: ${plane.altitude || 'N/A'} ft<br>Speed: ${plane.speed || 'N/A'} km/h`,
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              src: 'https://cdn-icons-png.flaticon.com/512/149/149040.png',
              scale: 0.05,
            }),
          })
        );

        vectorSource.addFeature(feature);
      }
    });

    const airportFeature = new Feature({
      geometry: new Point(fromLonLat([lon, lat])),
      name: 'Selected Airport',
    });

    airportFeature.setStyle(
      new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/124/124600.png',
          scale: 0.1,
        }),
      })
    );

    vectorSource.addFeature(airportFeature);

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    map.addLayer(vectorLayer);

    const select = new Select({
      condition: click,
      style: null,
    });

    map.addInteraction(select);

    const popup = new Overlay({
      element: document.createElement('div'),
      offset: [0, -20],
      positioning: 'bottom-center',
      stopEvent: false,
    });
    popup.getElement().className = 'popup';
    map.addOverlay(popup);

    select.on('select', (event) => {
      const selectedFeatures = event.target.getFeatures().getArray();
      if (selectedFeatures.length > 0) {
        const selectedFeature = selectedFeatures[0];
        const coord = selectedFeature.getGeometry().getCoordinates();
        if (selectedFeature.get('name') === 'Selected Airport') {
          setAudioUrl(radioUrl); // Use the radio URL from URL parameters
          setShowPlayer(true);
        } else {
          popup.setPosition(coord);
          popup.getElement().innerHTML = selectedFeature.get('info');
        }
      }
    });

    return () => map.setTarget(null);
  }, [planes, lat, lon, radioUrl]);

  return (
    <div>
      <div ref={mapElement} style={{ width: '100%', height: '100vh' }}></div>
      {showPlayer && <AudioPlayer url={audioUrl} onClose={() => setShowPlayer(false)} />}
      <style>
        {`
          .popup {
            background-color: white;
            border: 1px solid black;
            padding: 5px;
            font-size: 12px;
            width: 200px;
            pointer-events: none;
          }
        `}
      </style>
    </div>
  );
};

export default OpenLayerMap;