import React, { useState, useRef} from 'react';
import { useCollapse } from 'react-collapsed';
import '../index.css'; 
import useSWR from 'swr';
import Lightbox from 'yet-another-react-lightbox';
import "yet-another-react-lightbox/styles.css";
import { APIgetArtifacts , APIgetArtifactImageGrp} from '../APIurls';
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Inline } from 'yet-another-react-lightbox/plugins';
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Gallery } from "react-grid-gallery";

const config= {
    duration: 1000
};


const fetcherData = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());
const fetcherImageGrp = (APIgetArtifactImageGrp) => fetch(APIgetArtifactImageGrp).then((res) => res.json());

function Collapsible1() {
    const { getCollapseProps, getToggleProps, isExpanded } = useCollapse(config);
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(-1);
    const [auto, setAuto] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false)

    const handleClick = () => {
      setAuto(true)
      setShowLightbox(true)
      setOpen(true)

    }

    const fullscreenRef = useRef(null);
    const captionsRef = useRef(null);
    const artifactID = '1';

    const{
        data: data, 
        error, isValidating
      } = useSWR((APIgetArtifactImageGrp+artifactID/*+'/imagegroups'*/), fetcherImageGrp);
  
      if (error) return <div className="failed">failed to load</div>;
      if (isValidating) return <div className="loading">Loading...</div>;
    
    const imageList = data.images.map((artifact) => (
                          {
                            src: "http://localhost:8000/api/images/"+artifact.uri,
                            alt: (artifact.alt),
                            downloadUrl: (artifact.uri),
                            description: (artifact.caption)
                          }
                      ))

    const groupName = [data].map((artifact) => (
                          <div key ={artifact.id} className="imageGroupName">{artifact.name}</div>
      ))
    
    const LightBoxElem1 = () => (
      <Lightbox
          index={index}
          plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom, Inline]}
          slides={imageList}
          fullscreen={{ auto }}
          captions={{ ref: captionsRef }}
          on={{ 
            //view: ({ index: index }) => setIndex(index), 
            //click: () => {fullscreenRef.current?.enter()}
          }}
          open={index >= 0}
          close={() => setIndex(4)}
          />
      
    )
   
    console.log(index)
    

    const galleryElem1 = (
      
        <Gallery
            images={imageList}
            enableImageSelection={false}
            onClick={handleClick}
            
            
        />
      )

return (
    <div className="collapsible">
        <div className="header" {...getToggleProps()}> 
          
          {isExpanded ? <i class="fa-solid fa-caret-down"></i> : <i class="fa-solid fa-caret-right"></i> }
          {groupName}
            
        </div>
        <div {...getCollapseProps()}>
            <div className="content">
                {galleryElem1}
                { showLightbox ? <LightBoxElem1 /> : null }
                
                <br></br>
            </div>
        </div>
    </div>
    );
}


export default Collapsible1;
