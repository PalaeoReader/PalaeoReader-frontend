import React, {useState} from 'react';
import {fetchArtifactData} from '../API';

export function GetArtifact () {

  fetchArtifactData()
    .then((response) => response.clone().json())
    .then((response) => {
      const dat = response.data;
      console.log(dat);
      let rows = '';
      dat.forEach(data => {
        rows += <><h4 className="artifact-name">${dat.label}</h4>
                <p className="artifact-description">${dat.description}</p>
                <div className="original-date">${dat.origin_date}</div>
                <div className="artifact-date">${dat.discovery_date}</div>
                <div className="artifact-location">${dat.discovery_location}</div></>
      });
      console.log(rows);
      document.getElementById('artifact-detail').innerHTML = rows;
    })
  fetchArtifactData()
    .catch(error => console.log(error))

}

export default GetArtifact;
