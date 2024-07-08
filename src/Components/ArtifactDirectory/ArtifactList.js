import React, { Component } from 'react';
import ArtifactRow from './ArtifactRow';

class ArtifactList extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container main-content">
        <ArtifactRow />
      </div>
    );
  }
}

export default ArtifactList;