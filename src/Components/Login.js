import React , { useState} from 'react';

const Login = () => {

  //(props) => {
  const [username, setUser] = useState('')
  const [password, setPassword] = useState('')
  var token = useState('')

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
        .then((r) => r.json())
        .then((r) => {
          if (r === token) {
            localStorage.setItem('username', JSON.stringify({username}))
            props.setLoggedIn(true)
            props.setUser(username)
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
