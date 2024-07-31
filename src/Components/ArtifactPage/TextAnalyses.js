import React from 'react';
import { APIgetArtifactContentSets } from '../../APIurls';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';

const sourceID = '1';
const fetcher = (APIgetArtifactContentSets) => fetch(APIgetArtifactContentSets).then((res) => res.json());

export const TextAnalyses = () => {
    //const sourceID = useParams();

    //console.log(useParams());

    function mapInSlices(array, sliceSize, sliceFunc) {
        const out = [];
        for (var i = 0; i < array.length; i += sliceSize) {
          const slice = array.slice(i, i + sliceSize);
          out.push(sliceFunc(slice, i));
        }
        return out;
      }

    const{
        data: data, 
        error, isValidating
      } = useSWR(APIgetArtifactContentSets+sourceID, fetcher);
  
      if (error) return <div className="failed">failed to load</div>;
      if (isValidating) return <div className="loading">Loading...</div>;
    
return (
    <div className="text-analyses-div">
        <div className="text-analyses-title">
            <h3>Text Analyses</h3>
        </div>
        <div className="contents-div">
            {data.contents.map(object => (
                <div>
                    <li key={object.id} className="tooltip"><b>{object.set_id}:{object.id}</b> {object.text}</li>
                    <br />
                    <br />
                </div>

            ))
        }
        </div>

        <div className="tokens-div">
            {data.tokens.map(object => (
                <div className="individual-token-div">
                    <li key={object.id}>{object.text}</li>
                </div>
            ))}
        </div>

        <div className="morphs-div">
            {data.morphs.map(object => (
                <div className="individual-morphs-div">
                    <li key={object.id}>{object.text}</li>
                </div>
            ))}
        </div>
    </div>
)
}

export default TextAnalyses;