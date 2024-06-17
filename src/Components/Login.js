import React , { useState} from 'react';

const Login = () => {

  //(props) => {
  const [username, setUser] = useState("")
  const [password, setPassword] = useState("")
  var token = new String(useState(""))
  const [showPassword, setShowPassword] = useState(false);

 // }

  const onButtonClick = (callback) => {
      // fetching token from backend
      fetch('http://localhost:8000/api/login/access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'username': username,
          'password': password
        })
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.detail === "Incorrect username or password") {
            console.log(response.detail);
            window.alert('Incorrect username or password')
            

          } else if (response.detail === "undefined" | response.detail === "400 Bad Request") { /*this might need fixing*/
            console.log(response.detail)
            window.alert('Try again later.')

          } else {
            console.log(response.detail)
            window.alert('Successfully logged in.')
            localStorage.setItem('username', JSON.stringify({username}))
            //props.setLoggedIn(true)
            //props.setUser(username)
            //navigate('/')
            
          }
          
        })
    }

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

export default Login;
