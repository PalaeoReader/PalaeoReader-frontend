import React, {useState} from 'react';
import {fetchArtifactData} from '../API';

export function GetArtifact () {
    const label = new Proxy(new URLSearchParams("label"), {
      get: (searchParams, prop) => searchParams.get(prop)
    });
    // Get the value of "some_key" in eg "https://example.com/?some_key=some_value"
    let value = label.toString; // "some_value"
    
    /*const [description, setDescription] = useState("")
    const [CoverImage, setCoverImage] = useState("")
    const [OriginDate, setOriginDate] = useState("")
    const [DiscoveryDate, setDiscoveryDate] = useState("")
    const [OriginLocation, setOriginLocation] = useState("")*/



fetchArtifactData.then((response) => response.clone().json())
fetchArtifactData.then((response) => {
  if (typeof label != "undefined") {
    console.log(label)
  } else {
    console.log(label)
  }
})
  
return (
  window.addEventListener("load", GetArtifact)
)

}

export default GetArtifact;

