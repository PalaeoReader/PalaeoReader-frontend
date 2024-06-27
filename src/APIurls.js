import React from 'react';

const APIloginToken = 'http://localhost:8000/api/login/access-token'
const APIgetArtifacts = 'http://localhost:8000/api/artifacts'
const APIgetArtifactImages = 'http://localhost:8000/api/{dir}/{image_uri}'

export {
    APIloginToken,
    APIgetArtifactImages,
    APIgetArtifacts
}