import React, { useState } from 'react';
import ArtifactMetadata from './GetArtifact';
import { APIgetArtifacts } from '../APIurls';
import Collapsible1 from './Collapsible1';
import Collapsible2 from './Collapsible2';


const fetcherData = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());
    
const ArtifactDisplay = () => {
      
  const [Open, setOpen] = useState(false)
    
  const collapsible1Elem = (
      <Collapsible1 
      />
    )

  const collapsible2Elem = (
      <Collapsible2/>
    )
      

  return (
        <div className=''>
            <div className='artifact-metadata'>
                
              <ArtifactMetadata/>
                  
            </div>

            <br />
           

		            <div className='collapsible-div'>
                {collapsible1Elem}

                <br></br>

                {collapsible2Elem}
                </div>
        
            <br />

            <div className=''>
       
            </div>
       
        </div>
        )
      }
     //}

  export default ArtifactDisplay;