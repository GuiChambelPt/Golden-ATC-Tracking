import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AirportList from './components/AirportList';
import AirportDetail from './components/AirportDetail';
// Airport data
const airports = [
  { 
    id: 'LIS', 
    name: 'Lisbon Portela Airport', 
    lat: 38.7742, 
    lon: -9.1342,
    code: 'LPPT',
    atcLink: 'https://s1-fmt2.liveatc.net/lppt_app_1191_2'
  },
  { 
    id: 'OPO', 
    name: 'Porto Airport', 
    lat: 41.2421, 
    lon: -8.6754,
    radioLink: 'https://s1-bos.liveatc.net/lppr2',
    code: 'LPPR'
  },
  // Add more airports as needed
];


const App = () => {
  return (
    <Router>
      <div className="app">
        <h1>Golden ATC Tracking</h1>
        <Routes>
          <Route path="/" element={<AirportList airports={airports} />} />
          <Route path="/airport/:id" element={<AirportDetail airports={airports} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;