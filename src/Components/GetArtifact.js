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
  if (response.includes(label)) {
    root.render(label)
  } else {
    root.render("help")
  }
    //console.log(response))
})

return (
  window.addEventListener("load", GetArtifact)
)

/*
return (
<div className={'mainContainer'}>
<div className={'titleContainer'}>
<div>Welcome</div>
</div>
<br />
<div className={'inputContainer'}>
<input
  value={username}
  placeholder="Username"
  onChange={(ev) => setUser(ev.target.value)}
  className={'inputBox'}
/>
</div>
<br />
<div className={'inputContainer'}>
<input
  value={password}
  placeholder="Password"
  type={
    showPassword ? "text" : "password"
}
  onChange={(ev) => setPassword(ev.target.value)}
  className={'inputBox'}
/>
</div>
<br />
<br />
<label className="showPwLabel" for="check">Show Password</label>
        <input
            id="check"
            type="checkbox"
            value={showPassword}
            onChange={() =>
                setShowPassword((prev) => !prev)
            }
            
        />
<br />
<div className={'inputContainer'}>
<input className={'inputButton'} type="button" onClick={onButtonClick} value={'Log in'} />
</div>
</div>
)
}
*/
}

export default GetArtifact;

