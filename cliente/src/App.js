import logo from './logo.svg';
import './App.css';

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import SupervisorView from './components/SupervisorView';
import TecnicoView from './components/TecnicoView';

function App() {
  const userType = localStorage.getItem('userType');
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/supervisor" element={userType === 'supervisor' ? <SupervisorView /> : <Navigate to="./components/SupervisorView" />} />
          <Route path="/tecnico" element={userType === 'tecnico' ? <TecnicoView /> : <Navigate to="/components/TecnicoView" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
