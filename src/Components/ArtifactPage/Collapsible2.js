import React from 'react';
import { useCollapse } from 'react-collapsed';
import useSWR from 'swr';
import Lightbox from 'yet-another-react-lightbox';
import "yet-another-react-lightbox/styles.css";
import { APIgetArtifacts } from '../../APIurls';
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Gallery } from "react-grid-gallery";
import { useParams } from 'react-router-dom';


const config = {
    duration: 1000
};

const fetcherImageGrp2 = (APIgetArtifactImageGrp) => fetch(APIgetArtifactImageGrp).then((res) => res.json());
const fetcherData = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());


function Collapsible2() {
    const { getCollapseProps, getToggleProps, isExpanded } = useCollapse(config);
    const [index, setIndex] = React.useState(-1);
    const {shortName} = useParams();

    const handleClick = (index: number, item: CustomImage) => setIndex(index);

    const{
        data: data, 
        error, isValidating
      } = useSWR(APIgetArtifacts+shortName+'/image_groups', fetcherData);
  
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
  
    const LightBoxElem2 = () => (
        <Lightbox
        plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom]}
        slides={imageList}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
      />
    )

    const galleryElem2 = (
      <Gallery
          images={imageList}
          onClick={handleClick}
          enableImageSelection={false}
      />
    )

    // This creates two divs, because there are two groupNames.  This is the type of iteration you want to be doing, but in a ginel Collapsible file, creating a gallery for each element.
    const groupName = data.map((imageGroup, bar) => (
        console.log(imageGroup.name),
        <div key ={imageGroup.id} className="imageGroupName">{imageGroup.name}</div>
    ));

    return (
        <div className="collapsible">
            <div className="header" {...getToggleProps()}>

              {isExpanded ? <i class="fa-solid fa-caret-down"></i> : <i class="fa-solid fa-caret-right"></i> }
              {groupName}

            </div>
            <div {...getCollapseProps()}>
                <div className="content">
                    {galleryElem2}
                    <LightBoxElem2/>
                </div>
            </div>
        </div>
    );
}

export default Collapsible2;
