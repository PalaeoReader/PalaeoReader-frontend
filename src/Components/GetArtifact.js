import React, {useState} from 'react';
import {root} from '../index';
import {fetchLabel} from './API';

export function GetArtifact () {
    const [label] = useState("")
    /*const [description, setDescription] = useState("")
    const [CoverImage, setCoverImage] = useState("")
    const [OriginDate, setOriginDate] = useState("")
    const [DiscoveryDate, setDiscoveryDate] = useState("")
    const [OriginLocation, setOriginLocation] = useState("")*/



fetchLabel.then((response) => response.clone().json())
fetchLabel.then((response) => {
  if (response === label) {
    response.json()
  } else {
    
  }
    //console.log(response))
})

return (
  window.addEventListener("load", GetArtifact)
)

}

export default GetArtifact;

