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

    const addDefaultImg = ev => {
          ev.target.src = "https://image.hurimg.com/i/hurriyet/75/0x0/5c14ad0ec03c0e2ab815636a.jpg"
       }


  return (

    <div className="flexdiv">

      {data.map((artifact) => (

        <div className="artifact">
        
          <div className="artifact-detail">

                <div>

                  <div key={artifact.id} className="artifact-image">
                      <img src={"http://localhost:8000/api/images/"+artifact.cover_image} onError={addDefaultImg} alt="cover-image" height="225" width="350"/>
                  </div>

                  <li key={artifact.id}> <h4 className="artifact-name"><a href='http://localhost:3000/irq-bitiq'>{artifact.label}</a></h4></li>
                  <li key={artifact.id}> <p className="artifact-description">{artifact.description}</p> </li>
                  <li key={artifact.id}> <div className="original-date">Document date: {artifact.origin_date}</div></li>
                  <li key={artifact.id}> <div className="artifact-location">Location found: {artifact.location}</div></li>
                  <li key={artifact.id}> <div className="artifact-script">Script: {artifact.script}</div></li>
                  <li key={artifact.id}> <div className="artifact-material">Material: {artifact.material}</div></li>

                </div>

                    
          
          </div>
      </div>

            ))
                          
      }

    </div>

  );
}

export default ArtifactRow;
