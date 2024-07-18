import React from 'react';
import useSWR from 'swr';
import { APIgetArtifacts } from '../APIurls';
//import { fetchArtifactData } from '../API';

  // created function to handle API request
  const fetcher = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());

  export const ArtifactMetadata = () => {
    const{
      data: data, 
      error, isValidating
    } = useSWR(APIgetArtifacts, fetcher);

    if (error) return <div className="failed">failed to load</div>;
    if (isValidating) return <div className="loading">Loading...</div>;
  

  return (
   <>
    <div>
            
            {data.data.map((artifact, bar) => (

              <div>
                <li key={artifact.id}> <div className="artifact-image"> {artifact.cover_image}</div> </li>
                <li key={artifact.id}> <h4 className="artifact-name" href=''>{artifact.label}</h4> </li>
                <li key={artifact.id}> <p className="artifact-description">{artifact.description}</p> </li>
                <li key={artifact.id}> <div className="original-date">Document date: {artifact.origin_date}</div></li>
                <li key={artifact.id}> <div className="artifact-date">Date found: {artifact.discovery_date}</div></li>
                <li key={artifact.id}> <div className="artifact-location">Location found: {artifact.discovery_location}</div></li>
                <li key={artifact.id}> <div className="artifact-language">Language: {artifact.language}</div></li>
                <li key={artifact.id}> <div className="artifact-script">Script: {artifact.script}</div></li>
                <li key={artifact.id}> <div className="artifact-material">Material: {artifact.material}</div></li>
                <li key={artifact.id}> <div className="artifact-dimensions">Dimensions: {artifact.dimensions}</div></li>
                <li key={artifact.id}> <div className="artifact-current-location">Current location: {artifact.current_location}</div></li>

              </div>

  )) 

          
}
    </div>

    </>


  );

};


export default ArtifactMetadata;

/*{[data].map((id, data, label, origindate, description) => (
              <div>
                <li key={id}> <h4 className="artifact-name">{[data.label]}</h4> </li>
                <br></br>

              </div> 
          )) 
              
            }


                
                <br></br>
                
                  <h4 className="artifact-name">{data.label}</h4>
                
                 */