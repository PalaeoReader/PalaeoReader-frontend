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
    //console.log(data.data[0])
	 const imageList = data.data.map((artifact, index) => (
						{
							src:  "http://localhost:8000/api/images/"+artifact.uri,
							alt: (artifact.alt),
							description: (artifact.caption)
						}
					))
	 console.log(imageList)

	const images = data.data.map((image, index) => 
		<div><img src={"http://localhost:8000/api/images/"+image.uri} width="50%" alt={image.alt}/><br/>{image.caption}</div>
	);
	const lightBox = (
		<Lightbox 
			open={Open}
			close={() => setOpen(false)}
			plugins={[Captions]}
			slides={imageList}
		/>
	);

  return (
        <div className=''>
		  	{lightBox}
            <div className=''>
                <h4 bottom-padding="20px" top-padding="20px">Artifact 1</h4>

                <button onClick={() => setOpen(true)}>Open images</button>
                <Lightbox 
                    open={Open}
                    close={() => setOpen(false)}
                    plugins={[Captions]}
                    slides={imageList}
                    
                  />
                  
        </div>
        <br />
        <ul>
        <div className=''></div>
		  <div></div>
        </ul>
        
        <br />
        <div className=''>
       
        </div>
       
        </div>
        )
      }
     //}

  export default SwrImageData;
