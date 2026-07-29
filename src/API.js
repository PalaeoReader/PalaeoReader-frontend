import React from 'react';
import { apiUrl } from './config';

export default function fetchAccess () {
  const [username] = useState("");
  const [password] = useState("");

  var fetchData = fetch(apiUrl('/api/login/access-token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'username': username,
        'password': password
      })
    });
  return fetchData;
}

/*function fetchArtifactData () {
  var fetchData = fetch(
      '/api/artifacts',
      { method: 'GET' }
    );
    console.log(fetchData);
  return fetchData;
} */

function fetchArtifactImage () {
  var fetchData = fetch(
    apiUrl('/api/{dir}/{image_uri}'),
    {method: 'GET'}
  );
  return fetchData;
}

export {
  fetchAccess,
  //fetchArtifactData,
  fetchArtifactImage
}
