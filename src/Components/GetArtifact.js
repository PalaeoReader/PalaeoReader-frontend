import React, {useState, useEffect} from 'react';
import {fetchArtifactData} from '../API';

export function GetArtifact () {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchArtifactData.then((response) => response.clone().json())
    .then(data => setData(data))
    .catch(err => console.log(err))
    
  }, ([])

  )

  return (
    
    <div>
        <ul>
          {data.map((index, label) => (
              <li key={index}>{data.label}</li>


                 /* <h4 className="artifact-name">{data.label}</h4>
                  <p className="artifact-description">{data.description}</p>
                  <div className="original-date">{data.origin-date}</div>
                <div className="artifact-date">{data.discovery-date}</div>
                <div className="artifact-location">${dat.discovery-location}</div> */


              
              ))
            }
        </ul>
        
    </div>
  )
}

export default GetArtifact;

