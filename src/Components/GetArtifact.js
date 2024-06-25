import React, {useState, useEffect} from 'react';
import {fetchArtifactData} from '../API';

export function GetArtifact () {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchArtifactData.then((response) => response.clone().json())
    .then(data => setData(data))
    .then(console.log(data))
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
  fetchArtifactData()
    .then((response) => response.clone().json())
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
      console.log(rows);
      document.getElementById('artifact-detail').innerHTML = rows;
    })
  fetchArtifactData
    .catch(error => console.log(error))

}

export default GetArtifact;
