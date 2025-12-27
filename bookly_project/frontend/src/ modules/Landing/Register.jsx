

export default function Register(){
    return(
        <>
        <form action="">
           <div>
                <div><label htmlFor="name">Name:</label><input type="text" id="name" /></div>
                <div><label htmlFor="email">Email:</label><input type="email" id="email" /></div>
                <div><label htmlFor="password">Password:</label><input type="password" id="password" /></div>
                <div><label htmlFor="confirmPassword">Confirm Password:</label><input type="password" id="confirmPassword" /></div>
                <div><label htmlFor="phone">Phone:</label><input type="tel" id="phone" /></div>
           </div>
        </form>
        </>
    )
}