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

const fetcherData = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());


function CollapsibleElem() {
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
    
  
    const imageLists = data.map((imageGroup) => (
                        imageGroup.images.map((img) => (
                            {
										id: (img.id),
                                src: "http://localhost:8000/api/images/"+img.uri,
                                alt: (img.alt),
                                downloadUrl: "http://localhost:8000/api/images/"+img.uri,
                                description: (img.caption)
                            }
                        ))
                    ));

/*    const LightBoxElem = () => (
        <Lightbox
        plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom]}
        slides={imageList}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
      />
    )

    const galleryElem = (
      <Gallery
          images={imageList}
          onClick={handleClick}
          enableImageSelection={false}
      />
    )
	 */
	 console.log(imageLists, data);

    const collapsibleElem = imageLists.map((imageList, imageListId) => (
        <>
        <div className="header" {...getToggleProps()}>

              {isExpanded ? <i class="fa-solid fa-caret-down"></i> : <i class="fa-solid fa-caret-right"></i> }
              <div key={imageListId} className="imageGroupName">{data[imageListId].name}</div>

            </div>
            <div {...getCollapseProps()}>

<Gallery
          images={imageList}
          onClick={handleClick}
          enableImageSelection={false}
      />
        <Lightbox
        plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom]}
        slides={imageList}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
      />
            </div>
            <br />
            </>
    ));

    return (
        <div className="collapsible">
            {collapsibleElem}
        </div>
    );
}

export default CollapsibleElem;
