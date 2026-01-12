import { useNavigate } from "react-router-dom"

import Card from "./Card";
import heroImage from "../../pics/ChatGPT Image Jan 12, 2026 at 04_16_37 PM.png";

export default function LandingBody(){
    const navigate = useNavigate();


    return(
        <div className="landing-body bg-inherit ">
            <section className="flex flex-col lg:flex-row lg:justify-between items-center gap-6 lg:gap-10 p-6 sm:p-8 lg:p-10 bg-inherit rounded-lg ">
                <span className="flex flex-col justify-center items-start w-full lg:w-auto">
                    <h1 className="font-bold text-5xl">Foglalj egyszerűen és gyorsan</h1>
                    <p>Tedd egyszerűbbé a foglalást a bookly-val </p>
                    <button className="rounded-2xl bg-black text-white p-2" onClick={() => navigate('/login')}>Foglalás</button>
                </span>
                <span className="w-full lg:w-auto"><img src="" alt="section-1-alt" className="w-full max-w-md lg:max-w-lg xl:max-w-xl rounded-lg" /></span>
            </section>

            <section className=" bg-light-blue mt-10 rounded-lg py-4">
                <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-6 sm:mb-8 px-4">Miért használd a Bookly-t?</h1>
            <span className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 xl:gap-4 2xl:gap-6 px-4 sm:px-6 lg:px-4 xl:px-8 2xl:px-10 py-8">
                    <Card title="Időpont foglalás" description="Egyszerű és gyors időpontfoglalás a kedvenc szolgáltatóidhoz." imageUrl={heroImage} />
                    <Card title="Card 2" description="Description for card 2" imageUrl="image2.jpg" />
                    <Card title="Card 3" description="Description for card 3" imageUrl="image3.jpg" />
            </span>
            </section>

            <section className="">
               <span className="flex flex-col justify-center items-center gap-4 p-6 sm:p-8 lg:p-10 bg-inherit rounded-lg">
                    <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-6 sm:mb-8 px-4">Vállakozó vagy?</h1>
                    <p className="text-center mb-6 sm:mb-8 px-4">Szeretnél egy egyszerű és átlátható rendszert a foglalások kezelésére?</p>
                    <button className="rounded-2xl bg-black text-white p-2">Csatlakozz!</button>
               </span>
            <span className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 xl:gap-4 2xl:gap-6 px-4 sm:px-6 lg:px-4 xl:px-8 2xl:px-10 py-8">
                    <Card title="Card 1" description="Description for card 1" imageUrl={heroImage} />
                    <Card title="Card 2" description="Description for card 2" imageUrl="image2.jpg" />
                    <Card title="Card 3" description="Description for card 3" imageUrl="image3.jpg" />
            </span>
            </section>
        </div>
    )
}

