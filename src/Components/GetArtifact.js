import React from 'react';
import useSWR from 'swr';
import { APIgetArtifacts } from '../APIurls';
//import { fetchArtifactData } from '../API';

  // created function to handle API request
  const fetcher = (APIgetArtifacts) => fetch(APIgetArtifacts).then((res) => res.json());

  export const Swr = () => {
    const{
      data: data, 
      error, isValidating
    } = useSWR(APIgetArtifacts, fetcher); //fix this part

    if (error) return <div className="failed">failed to load</div>;
    if (isValidating) return <div className="loading">Loading...</div>;
    const label = JSON.stringify([data.label]);
    console.log(label);
  

  return (
   <>
    <div>
          {[data].map((id, data, label, origindate, description) => (
              <div>
                <li key={id}> <h4 className="artifact-name">{[data.label]}</h4> </li>
                <br></br>

              </div> 
          )) 
          .filter(data => typeof data ==='string')
              
            }
      
    </div>
    </>
  );

};


export default Swr;

/*
                <li key={id}> <div className="original-date"> Document date: {data.origindate}</div></li>
                <br></br>
                <li key={id}> <p className="artifact-description"{data.description}></p> </li>
                  <h4 className="artifact-name">{data.label}</h4>
                <div className="artifact-date">{data.discovery-date}</div>
                <div className="artifact-location">${dat.discovery-location}</div> */