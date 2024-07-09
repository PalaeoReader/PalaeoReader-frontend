import React, { useState } from 'react';
import { useCollapse } from 'react-collapsed';
import '../index.css'; 
import useSWR from 'swr';
import Lightbox from 'yet-another-react-lightbox';
import "yet-another-react-lightbox/styles.css";
import { APIgetArtifactImageGrp1 } from '../APIurls';
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Inline } from 'yet-another-react-lightbox/plugins';
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Gallery } from "react-grid-gallery";

const config = {
    duration: 1000
};

const fetcherImageGrp1 = (APIgetArtifactImageGrp1) => fetch(APIgetArtifactImageGrp1).then((res) => res.json());

function Collapsible1() {
    const { getCollapseProps, getToggleProps, isExpanded } = useCollapse(config);
    const [index, setIndex] = useState(-1);

    const{
        data: data, 
        error, isValidating
      } = useSWR(APIgetArtifactImageGrp1, fetcherImageGrp1);
  
      if (error) return <div className="failed">failed to load</div>;
      if (isValidating) return <div className="loading">Loading...</div>;
    
    const imageList = data.images.map((artifact, index) => (
                          {
                            src: "http://localhost:8000/api/images/"+artifact.uri,
                            alt: (artifact.alt),
                            downloadUrl: (artifact.uri),
                            description: (artifact.caption)
                          }
                      ))

    const groupName = [data].map((artifact, index) => (
                          <div key ={artifact.id} className="imageGroupName">{artifact.name}</div>
      ))
      
    //const handleClick = {({index: >=0}) => setIndex(index)};

    const lightBoxElem1 = (
        <Lightbox
            index={index}
            plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom, Inline]}
            slides={imageList}
            open={index >= 0}
            close={() => setIndex(-1)}
            />
        
      )

    const galleryElem1 = (
        <Gallery
            images={imageList}
            //onClick={handleClick}
            enableImageSelection={false}
            
        />
      )

return (
    <div className="collapsible">
        <div className="header" {...getToggleProps()}>
          
          {isExpanded ? <i class="fa-solid fa-caret-down"></i> : <i class="fa-solid fa-caret-up"></i> }
          <h3>{groupName}</h3>
            
        </div>
        <div {...getCollapseProps()}>
            <div className="content">
                {galleryElem1}
                

                <br></br>
                Click <i>Collapse</i> to hide this content...
            </div>
        </div>
    </div>
    );
}


export default Collapsible1;
