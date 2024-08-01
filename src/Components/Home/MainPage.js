import React from 'react';

function MainPage () {
    return(
        <div>
            <h2 className="welcome-title">Welcome!</h2>

            <div className="main-page-div">

                <div className="directory-div">
                    <p className="directory-title" >Directory</p>
                    <br />
                    <a href="http://localhost:3000/directory"><button>Click to see all of the artifacts in our directory</button></a>
                </div>

                <div className="login-div">
                    <p className="login-title">Login</p>
                    <br />
                    <a href="http://localhost:3000/login"><button>Click to log in</button></a>
                </div>
                
            </div>
        </div>
    )
}

export default MainPage;