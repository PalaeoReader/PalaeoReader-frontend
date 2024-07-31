import React from 'react';
import useSWR from 'swr';
import { APIgetArtifacts } from '../../APIurls';
import { useParams } from 'react-router-dom';

  // created function to handle API request

  const fetcher = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());
  //const fetcherShortName = ()

  export const ArtifactMetadata = () => {
    const {shortName} =  useParams();

    const{
      data: data, 
      error, isValidating
    } = useSWR(APIgetArtifacts+shortName, fetcher);

    if (error) return <div className="failed">failed to load</div>;
    if (isValidating) return <div className="loading">Loading...</div>;
    

  return (
    <div>

      {[data].map(artifact => (

        <div className="artifact-data">

          
              <div>
                <li key={artifact.id}> <img className="artifact-image-on-page" src={"http://localhost:8000/api/images/"+artifact.cover_image} alt="cover-image" height="225" width="350"/></li>
                <li key={artifact.id}> <h4 className="artifact-name">{artifact.label}</h4> </li>
                <li key={artifact.id}> <p className="artifact-description" dangerouslySetInnerHTML={{ __html:artifact.description}}></p> </li>
                <li key={artifact.id}> <div className="original-date">Document date: {artifact.origin_date}</div></li>
                <li key={artifact.id}> <div className="artifact-date">Date found: {artifact.discovery_date}</div></li>
                <li key={artifact.id}> <div className="artifact-location">Location found: {artifact.discovery_location}</div></li>
                <li key={artifact.id}> <div className="artifact-language">Language: {artifact.language}</div></li>
                <li key={artifact.id}> <div className="artifact-script">Script: {artifact.script}</div></li>
                <li key={artifact.id}> <div className="artifact-material">Material: {artifact.material}</div></li>
                <li key={artifact.id}> <div className="artifact-dimensions">Dimensions: {artifact.dimensions}</div></li>
                <li key={artifact.id}> <div className="artifact-current-location">Current location: {artifact.current_location}</div></li>

              </div>

  
        </div>
                       )) 

                        
           }

    </div>
  );
  

};


export default ArtifactMetadata;