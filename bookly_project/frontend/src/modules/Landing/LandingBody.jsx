import { useNavigate } from "react-router-dom"

import Card from "./Card";
import appointment from "../../pics/appointment.png";
import services from "../../pics/services.png";
import allinone from "../../pics/allinone.png";
import calendar from "../../pics/calendar.png";
import connectionservices from "../../pics/connectionservice.png";
import collision from "../../pics/collision.png";

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
                <span className="w-full lg:w-auto"><img src="sectionimage.jpg" alt="section-1-alt" className="w-full max-w-md lg:max-w-lg xl:max-w-xl rounded-lg" /></span>
            </section>

            <section className=" bg-light-blue mt-10 rounded-lg py-4">
                <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-6 sm:mb-8 px-4">Miért használd a Bookly-t?</h1>
            <span className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 xl:gap-4 2xl:gap-6 px-4 sm:px-6 lg:px-4 xl:px-8 2xl:px-10 py-8">
                    <Card title="Időpont foglalás" description="Egyszerű és gyors időpontfoglalás a kedvenc szolgáltatóidhoz." imageUrl={appointment} />
                    <Card title="Széles Választék" description="Partnereink széles választékából tudsz böngészni kedvedre" imageUrl={services} />
                    <Card title="Minden egy helyen" description="Nálunk minden szolgáltatás elérhető egy helyen" imageUrl={allinone} />
            </span>
            </section>

            <section className="">
               <span className="flex flex-col justify-center items-center gap-4 p-6 sm:p-8 lg:p-10 bg-inherit rounded-lg">
                    <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-6 sm:mb-8 px-4">Vállakozó vagy?</h1>
                    <p className="text-center mb-6 sm:mb-8 px-4">Szeretnél egy egyszerű és átlátható rendszert a foglalások kezelésére?</p>
                    <button onClick={() => navigate('/provider/landing')} className="rounded-2xl bg-black text-white p-2">Csatlakozz!</button>
               </span>
            <span className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 xl:gap-4 2xl:gap-6 px-4 sm:px-6 lg:px-4 xl:px-8 2xl:px-10 py-8">
                    <Card title="Átlátható időpontok" description="A Bookly-val egyszerűen és átláthatóan tudod kezelni ügyfeleid időpontjait" imageUrl={calendar} />
                    <Card title="Kapcsolatbiztosítás" description="Felmerülő probléma esetén gyorsan el tudod érni az ügyfeleket" imageUrl={connectionservices} />
                    <Card title="Időpont-egyeztetés támogatás" description="Segít az átfedések és ütközések elkerülésében" imageUrl={collision} />
            </span>
            </section>
        </div>
    )
}

    