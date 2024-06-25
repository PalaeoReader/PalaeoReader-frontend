import React, {useState, useEffect} from 'react';
import {fetchArtifactData} from '../API';

export function GetArtifact () {
  const [data, setData] = useState([])

  useEffect(() => {

  fetchArtifactData()
    .then((response) => response.clone().json())
    .then(data => setData(data))
    .then(console.log(data))
    .catch(err => console.log(err))
    
  }, ([])

    /*.then((response) => response.clone().json())
    .then((response) => {
      const dat = response.data;
      let rows = '';
      dat.foreach(data => {
        rows += <><h4 className="artifact-name">${dat.label}</h4>
                <p className="artifact-description">${dat.description}</p>
                <div className="original-date">${dat.origin-date}</div>
                <div className="artifact-date">${dat.discovery-date}</div>
                <div className="artifact-location">${dat.discovery-location}</div></>
      });
    */


  )

  return (
    
    <div>
        
          {[data].map((id, data, label) => (
              <div>
                <li key={id}> <h4 className="artifact-name">{[data].label}</h4> </li>
                <br></br>
                
              </div> 
          )) 
/*
 <li key={id}> <div className="original-date"> Document date: {[data].origin-date}</div></li>
<li key={id}> <p className="artifact-description"{[data].description}></p> </li>
                  <h4 className="artifact-name">{data.label}</h4>
                <div className="artifact-date">{data.discovery-date}</div>
                <div className="artifact-location">${dat.discovery-location}</div> */


              
              
            }
            
        
        
    </div>
  )
  
}

export default GetArtifact;