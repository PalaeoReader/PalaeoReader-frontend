import React from 'react';
import { useCollapse } from 'react-collapsed';
import useSWR from 'swr';
import Lightbox from 'yet-another-react-lightbox';
import "yet-another-react-lightbox/styles.css";
import { APIgetArtifactImagesGrp2 } from '../APIurls';
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Inline } from 'yet-another-react-lightbox/plugins';
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const config = {
    duration: 1000
};

const fetcherImageGrp2 = (APIgetArtifactImagesGrp2) => fetch(APIgetArtifactImagesGrp2).then((res) => res.json());


function Collapsible2() {
    const { getCollapseProps, getToggleProps, isExpanded } = useCollapse(config);
    /*const [index, setIndex] = React.useState(-1);

    const{
        data: data, 
        error, isValidating
      } = useSWR(APIgetArtifactImagesGrp2, fetcherImageGrp2);
  
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
  
      const lightBoxElem2 = (
        <Lightbox 
          index={index}
          plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom, Inline]}
          slides={imageList}
          open={index >= 0}
          close={() => setIndex(-1)}
          inline={{
            style: { width: "50%", maxWidth: "700px", aspectRatio: "3 / 2" },
          }}
        />
      )*/

return (
    <div className="collapsible">
        <div className="header" {...getToggleProps()}>
          {isExpanded ? <i class="fa-solid fa-caret-down"></i> : <i class="fa-solid fa-caret-up"></i>}
        </div>
        <div {...getCollapseProps()}>
            <div className="content">
                Now you can see the hidden content. <br/><br/>
                
                Click <i>Collapse</i> to hide this content... <br/><br/>
            </div>
        </div>
    </div>
    );
}

export default Collapsible2;