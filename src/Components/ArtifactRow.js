import React from 'react';
import {Swr} from './GetArtifact';

const ArtifactRow = () => {
  return (
    <div className="row artifact">
      <div className="artifact-image">
        <img src="https://image.hurimg.com/i/hurriyet/75/0x0/5c14ad0ec03c0e2ab815636a.jpg" alt="Sample image" height="225"/>
      </div>
      <div className="artifact-detail">
        <Swr/>
      </div>
    </div>
  );
}

export default ArtifactRow;
