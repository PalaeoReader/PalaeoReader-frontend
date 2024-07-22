import React from 'react';
import ArtifactMetadata from '../GetArtifact';
import useSWR from 'swr';
import { APIgetArtifacts } from '../../APIurls';

  // created function to handle API request
  const fetcher = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());

export const ArtifactRow = () => {
    const{
      data: data, 
      error, isValidating
    } = useSWR(APIgetArtifacts, fetcher);

    if (error) return <div className="failed">failed to load</div>;
    if (isValidating) return <div className="loading">Loading...</div>;

  return (
    <div className="row artifact">
     
      <div className="artifact-detail">

        <div>
            
            {data.data.map((artifact, bar) => (

              <div>

                 <div className="artifact-image">
                    <img src="https://image.hurimg.com/i/hurriyet/75/0x0/5c14ad0ec03c0e2ab815636a.jpg" alt="Sample image" height="225" width="350"/>
                 </div>

                <li key={artifact.id}> <div className="artifact-image" href=''> {artifact.cover_image}</div> </li>
                <li key={artifact.id}> <h4 className="artifact-name" href=''>{artifact.label}</h4> </li>
                <li key={artifact.id}> <p className="artifact-description">{artifact.description}</p> </li>
                <li key={artifact.id}> <div className="original-date">Document date: {artifact.origin_date}</div></li>
                <li key={artifact.id}> <div className="artifact-date">Date found: {artifact.discovery_date}</div></li>

              </div>

                  ))
                          
                }
        </div>
      </div>
    </div>
  );
}

export default ArtifactRow;
