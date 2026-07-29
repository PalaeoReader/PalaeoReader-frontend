import React from 'react';
import useSWR from 'swr';
import { useCollapse } from 'react-collapsed';
import { APIgetArtifacts } from '../../APIurls';
import { apiUrl } from '../../config';
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
                <li key={artifact.id}> <img className="artifact-image-on-page" src={apiUrl("/api/images/"+artifact.cover_image)} alt="cover-image" height="225" width="350"/></li>
                <li key={artifact.id}> <h4 className="artifact-name">{artifact.label}</h4> </li>
                <li key={artifact.id}> <p className="artifact-description" dangerouslySetInnerHTML={{ __html:artifact.description}}></p> </li>
                <li key={artifact.id}> <div className="original-date"><span className='artifact_metadata_titles'>Document date:</span> {artifact.origin_date}</div></li>
                <li key={artifact.id}> <div className="artifact-date"><span className='artifact_metadata_titles'>Date found:</span> {artifact.discovery_date}</div></li>
                <li key={artifact.id}> <div className="artifact-location"><span className='artifact_metadata_titles'>Location found:</span> {artifact.discovery_location}</div></li>
                <li key={artifact.id}> <div className="artifact-language"><span className='artifact_metadata_titles'>Language:</span> {artifact.language}</div></li>
                <li key={artifact.id}> <div className="artifact-script"><span className='artifact_metadata_titles'>Script:</span> {artifact.script}</div></li>
                <li key={artifact.id}> <div className="artifact-material"><span className='artifact_metadata_titles'>Material:</span> {artifact.material}</div></li>
                <li key={artifact.id}> <div className="artifact-dimensions"><span className='artifact_metadata_titles'>Dimensions:</span> {artifact.dimensions}</div></li>
                <li key={artifact.id}> <div className="artifact-current-location">Current location: {artifact.current_location}</div></li>

              </div>

  
        </div>
                       )) 

                        
           }

    </div>
  );
  

};


export default ArtifactMetadata;