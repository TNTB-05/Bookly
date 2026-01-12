export default function ContactModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-light-blue bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="flex flex-col gap-6 max-w-4xl w-full mx-4">
            <section className="flex flex-col lg:flex-row lg:justify-between items-center gap-6 lg:gap-10 p-6 sm:p-8 lg:p-10 bg-inherit rounded-lg w-full lg:w-auto" onClick={(e) => e.stopPropagation()}>
                <span className="flex flex-col justify-center items-start w-full lg:w-auto">
                    <h1 className="font-bold text-5xl">Kérdésed van, információra van szükséged?</h1>
                    <p>Mi szívesen segítünk neked.</p>
                </span>
                <span className="w-full lg:w-auto bg-white p-4 rounded-lg">
                    <form action="">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name">Neved:</label>
                            <br />
                            <input type="text" id="name" required placeholder="Pl: Kis Lajos" />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email">Email: </label>
                            <br />
                            <input type="email" id="email" required placeholder="pelda@pelda.com" />
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label htmlFor="phone">Telefonszám: </label>
                            <br />
                            <input type="tel" id="phone" required placeholder="+36 1 234 5678" />
                        </div>

                        {/* Message Field */}
                        <div>
                            <label htmlFor="message">Üzenet: </label>
                            <br />
                            <textarea id="message" required placeholder="Üzenet szövege" rows="4" />
                        </div>

                        <button type="submit" className="mt-4 rounded-2xl bg-black text-white p-2"> Küldés</button>
                    </form>
                </span>
            </section>
            <section>
                <span>
                    <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-6 sm:mb-8 px-4">Elérhetőségeink</h1>
                </span>
                <span className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 xl:gap-4 2xl:gap-6 px-4 sm:px-6 lg:px-4 xl:px-8 2xl:px-10 py-8">
                    <div className="bg-gray-50 rounded-lg shadow-md p-4 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <h2 className="text-lg font-semibold mb-2">Telefon</h2>
                        <p className="text-gray-700">+36 1 234 5678</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg shadow-md p-4 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <h2 className="text-lg font-semibold mb-2">Email</h2>
                        <p className="text-gray-700">info@bookly.hu</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg shadow-md p-4 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <h2 className="text-lg font-semibold mb-2">Üzleti Email</h2>
                        <p className="text-gray-700">business@bookly.hu</p>
                    </div>
                </span>
            </section>
            </div>
        </div>
    );
}
