import React, { useState } from 'react';
import ArtifactMetadata from './GetArtifact';
import CollapsibleElem from './CollapsibleElem';
import TextAnalyses from './TextAnalyses';
import useSWR from 'swr';
import { APIgetArtifacts } from '../../APIurls';
import { useParams } from 'react-router-dom';

const fetcherData = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());

    
const ArtifactDisplay = () => {
  const {shortName} = useParams();

  const{
        data: data, 
        error, isValidating
      } = useSWR(APIgetArtifacts+shortName+'/image_groups', fetcherData);
  
    if (error) return <div className="failed">failed to load</div>;
    if (isValidating) return <div className="loading">Loading...</div>;
  
  const collapsibleElem = (
      <CollapsibleElem
      />
    )


  const textContent = (
      <TextAnalyses/>
  )
      

  return (
        <div className=''>

            <div className='artifact-metadata'>
              <ArtifactMetadata/>
            </div>

            <br />

            <div className="textContent-div">
              {textContent}
            </div>

            <br />
           
            <div>
              <h3 className="image-groups-title">Images</h3>
            </div>

		        <div className='collapsible-div'>
              {collapsibleElem}

            </div>
        
            <br />
      
       
        </div>
        )
      }
     //}

  export default ArtifactDisplay;