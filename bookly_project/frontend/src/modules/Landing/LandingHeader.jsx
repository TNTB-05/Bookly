
import Logo from '../logo';

export default function LandingHeader(){
    return(
        <>
      <div className="landing-header flex justify-between p-4 mr-4 ml-4">
            <span className="flex items-center gap-2">
                <Logo className="h-12 w-22 object-contain" />
            </span>
            <span>
                <button>Szolgáltató vagyok</button>
            </span>
            
      </div>
      
        </>
    )
}