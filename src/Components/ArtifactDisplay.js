import React, { useState } from 'react';
import useSWR from 'swr';
import {APIgetArtifacts, APIgetArtifactImagesGrp1} from '../APIurls';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";

//export function ArtifactDisplay() {
  

//const fetcherData = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());
const fetcherImage = (APIgetArtifactImagesGrp1) => fetch(APIgetArtifactImagesGrp1).then((res) => res.json());

const SwrImageData = () => {
      
    const [Open, setOpen] = useState(false)
    
    const{
        data: data, 
              error, isValidating

          } = useSWR(APIgetArtifactImagesGrp1, fetcherImage);

    if (error) return <div className="failed">failed to load</div>;
    if (isValidating) return <div className="loading">Loading...</div>;

    console.log(data)


    return (
        <div className=''>
        <div className=''>
        <h4 bottom-padding="20px" top-padding="20px">Artifact 1</h4>

        <button onClick={() => setOpen(true)}>Open images</button>
        <Lightbox 
         open={Open}
         close={() => setOpen(false)}
                                plugins={[Captions]}
                                slides={(data.data.map((artifact, index) =>  
                                              [
                                                {
                                                  src:  (artifact.uri),
                                                  alt: (artifact.alt),
                                                  description: (artifact.caption)
                                                }
                                          
                                              ]
                                                      )
                                        )
                                
                                        }
                                
                              />
                              
                    </div>
                    <br />
                    <ul>
                    <div className=''></div>
                    </ul>
                    
                    <br />
                    <div className=''>
                  
                    </div>
                  
                    </div>
                    )
                  }
          //}

  export default SwrImageData;