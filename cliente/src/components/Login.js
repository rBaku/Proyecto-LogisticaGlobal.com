import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (type) => {
    localStorage.setItem('userType', type);
    navigate(`/${type}`);
  };

  return (
    <div>
      <h2>Selecciona tu tipo de usuario</h2>
      <button onClick={() => handleLogin('supervisor')}>Entrar como Supervisor</button>
      <button onClick={() => handleLogin('tecnico')}>Entrar como Técnico</button>
    </div>
  );
}

export default Login;