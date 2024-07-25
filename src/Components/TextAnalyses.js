import React from 'react';
import { APIgetArtifactContentSets } from '../APIurls';
import useSWR from 'swr';

const sourceID = '1';
const fetcher = (APIgetArtifactContentSets) => fetch(APIgetArtifactContentSets).then((res) => res.json());

export const TextAnalyses = () => {

    const{
        data: data, 
        error, isValidating
      } = useSWR(APIgetArtifactContentSets+sourceID, fetcher);
  
      if (error) return <div className="failed">failed to load</div>;
      if (isValidating) return <div className="loading">Loading...</div>;
    
return (
    <div className="text-analyses-div">
        <div className="contents-div">
            {data.contents.map(object => (
                <div>
                    <li key={object.id}>{object.text}</li>
                    
                </div>

            ))
        }
        </div>

        <div className="tokens-div">
            {data.tokens.map(object => (
                <div>
                    <li key={object.id}>{object.text}</li>
                </div>
            ))}
        </div>

        <div className="morphs-div">
            {data.morphs.map(object => (
                <div>
                    <li key={object.id}>{object.text}</li>
                </div>
            ))}
        </div>
    </div>
)
}

export default TextAnalyses;