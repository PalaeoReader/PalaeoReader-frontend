import React from 'react';

export default function fetchAccess () {
  const [username] = useState("");
  const [password] = useState("");

  return (
    fetch('http://localhost:8000/api/login/access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'username': {username},
        'password': {password}
      })
    })
);

}

function fetchArtifactData () {
  fetch('http://localhost:8000/api/artifacts'),{ 
    method: 'GET', 
    headers: {'Content-Type': 'application/json'} 
  }
    
}

export {
  fetchAccess,
  fetchArtifactData
}
