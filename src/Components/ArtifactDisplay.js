import React, { useState } from 'react';
import ArtifactMetadata from './GetArtifact';
import Collapsible1 from './Collapsible1';
import Collapsible2 from './Collapsible2';
import TextAnalyses from './TextAnalyses';

    
const ArtifactDisplay = () => {

    
  const collapsible1Elem = (
      <Collapsible1 
      />
    )

  const collapsible2Elem = (
      <Collapsible2/>
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
              {collapsible1Elem}

              <br></br>

              {collapsible2Elem}
            </div>
        
            <br />
      
       
        </div>
        )
      }
     //}

  export default ArtifactDisplay;