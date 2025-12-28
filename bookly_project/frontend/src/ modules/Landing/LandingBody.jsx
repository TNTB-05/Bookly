import { useState } from "react"
import Login from "./Login";
import Register from "./Register";


export default function LandingHeader(){
    const [buttonClicked, setButtonClicked] = useState(null);


    function handleClick(button){
        setButtonClicked((a)=> button);
    }
    return(
        <>
        {!buttonClicked && <div>
            <button onClick={()=>(handleClick("Login"))}>Login</button>
            <button onClick={()=>(handleClick("Register"))}>Register</button>
        </div>}

        {buttonClicked && <button onClick={()=>(handleClick(null))}>Back</button>}
        {buttonClicked === "Login" && <Login />}
        {buttonClicked === "Register" && <Register />}
        </>
    )
}
