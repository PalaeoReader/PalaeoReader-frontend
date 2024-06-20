import React from 'react';
import {GetArtifact} from './GetArtifact';

const ArtifactRow = () => {
  return (
    <div className="row artifact">
      <div className="artifact-image">
        <img src="https://image.hurimg.com/i/hurriyet/75/0x0/5c14ad0ec03c0e2ab815636a.jpg" alt="Sample Image" height="225" border="solid" border-color="black"/>
      </div>
      <div className="artifact-detail">
      
        <a>{<GetArtifact />}</a>
        <p>Here's a description of the artifact.</p>
      </div>
      <div className="original-date">
        Document date:
      </div>
      <div className="artifact-date">
        Date found:
      </div>
      <div className="artifact-location">
        Location found:
      </div>
      
    </div>
  );
}

export default ArtifactRow;
