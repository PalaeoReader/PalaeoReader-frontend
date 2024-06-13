import React , { useState} from 'react';

function Login() { 
  
  //(props) => {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  var token = useState('')
      
 // }

  const onButtonClick = (callback) => {
      // fetching token from backend
      fetch('http://localhost:8000/api/login/access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({user, password}),
      })
        .then((r) => r.json())
        .then((r) => {
          if (r === token) {
            localStorage.setItem('user', JSON.stringify({user}))
            props.setLoggedIn(true)
            props.setUser(user)
            navigate('/')
          } else {
            window.alert('Wrong username or password')
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
          value={user}
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
          onChange={(ev) => setPassword(ev.target.value)}
          className={'inputBox'}
        />
      </div>
      <br />
      <div className={'inputContainer'}>
        <input className={'inputButton'} type="button" onClick={onButtonClick} value={'Log in'} />
      </div>
    </div>
  )
}

export default Login;