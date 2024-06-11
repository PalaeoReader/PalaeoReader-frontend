import React from 'react';

const ArtifactRow = () => {
  return (
    <div className="row artifact">
      <div className="col-md-2">
        <img src="https://image.hurimg.com/i/hurriyet/75/0x0/5c14ad0ec03c0e2ab815636a.jpg" alt="Sample Image" height="150" />
      </div>
      <div className="col-md-8 artifact-detail">
        <h4>Old Turkic Artifact 1</h4>
        <p>Here's a description of the artifact.</p>
      </div>
      <div className="col-md-2 artifact-location-date">
        Found in location at date.
      </div>
    </div>
  );
}

export default ArtifactRow;
