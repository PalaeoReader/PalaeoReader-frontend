import React, { useState, useRef} from 'react';
import { useCollapse } from 'react-collapsed';
import '../../index.css'; 
import useSWR from 'swr';
import Lightbox from 'yet-another-react-lightbox';
import "yet-another-react-lightbox/styles.css";
import { APIgetArtifacts , APIgetArtifactImageGrp} from '../../APIurls';
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Gallery } from "react-grid-gallery";
import { useParams } from 'react-router-dom';

const config= {
    duration: 1000
};


const fetcherData = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());
const fetcherImageGrp = (APIgetArtifactImageGrp) => fetch(APIgetArtifactImageGrp).then((res) => res.json());

function Collapsible1() {
    const { getCollapseProps, getToggleProps, isExpanded } = useCollapse(config);
    const [index, setIndex] = useState(-1);

    const fullscreenRef = useRef(null);
    const captionsRef = useRef(null);
    //const artifactID = '1';
    const {shortName} = useParams();

    const{
        data: data, 
        error, isValidating
      } = useSWR((APIgetArtifacts+shortName+'/image_groups'), fetcherData);
  
    if (error) return <div className="failed">failed to load</div>;
    if (isValidating) return <div className="loading">Loading...</div>;
    
    const imageList = data.map((artifact) => (
                        artifact.images.map((img) => (
                            {
                                src: "http://localhost:8000/api/images/"+img.uri,
                                alt: (img.alt),
                                downloadUrl: (img.uri),
                                description: (img.caption)
                            }
                        ))
                    ));

    const handleClick = (index: number, item: CustomImage) => setIndex(index);

    const groupName = data.map((artifact) => (
                          <div key ={artifact.id} className="imageGroupName">{artifact.name}</div>
                      ))

    const LightBoxElem1 = () => (
        <Lightbox
            plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom]}
            slides={imageList}
            open={index >= 0}
            index={index}
            close={() => setIndex(-1)}
        />
      )
   
    const galleryElem1 = (
        <Gallery
            images={imageList}
            onClick={handleClick}
            enableImageSelection={false}
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
                    <LightBoxElem1/>
                </div>
            </div>
        </div>
    );
}


export default Collapsible1;
