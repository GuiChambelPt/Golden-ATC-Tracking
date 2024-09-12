import React from 'react';
import { Link } from 'react-router-dom';

const AirportList = ({ airports }) => {
  return (
    <div className="airport-list">
      <h2>Select an Airport</h2>
      <ul>
        {airports.map(airport => (
          <li key={airport.id}>
            <Link to={`/airport/${airport.id}`}>
              {airport.name} ({airport.id})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AirportList;