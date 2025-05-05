import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import SupervisorView from './components/SupervisorView';
import TecnicoView from './components/TecnicoView';

import logo from './logo.svg';
import './App.css';

function App() {
  const userType = localStorage.getItem('userType');

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Edit <code>src/App.js</code> and save to reload.</p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/supervisor"
            element={
              userType === 'supervisor' ? <SupervisorView /> : <Navigate to="/" />
            }
          />
          <Route
            path="/tecnico"
            element={
              userType === 'tecnico' ? <TecnicoView /> : <Navigate to="/" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;