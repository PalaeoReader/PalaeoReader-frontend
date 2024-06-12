import React, { useState, useEffect } from 'react';

function Login() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/.backend/app/api/routes/login.py')
      .then(response => response.json())
      .then(json => setData(json))
      .catch(error => console.error(error));
  }, []);

  return (
    <div>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : 'Loading...'}
    </div>
  );
}

export default Login;