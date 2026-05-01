import PhoneIcon from '../../icons/PhoneIcon';
import EmailIcon from '../../icons/EmailIcon';
import LocationIcon from '../../icons/LocationIcon';
import CloseIcon from '../../icons/CloseIcon';

export default function ContactModal({ onClose }) {
    return (
        <div
            className="fixed inset-0 bg-dark-blue/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
                    aria-label="Bezárás"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="bg-dark-blue text-white px-6 sm:px-10 py-10 text-center">
                    <span className="inline-block mb-3 text-xs font-semibold tracking-widest uppercase text-white/60 bg-white/10 px-3 py-1 rounded-full">
                        Kapcsolat
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                        Kérdésed van? Itt vagyunk.
                    </h1>
                    <p className="mt-3 text-white/70 text-sm sm:text-base max-w-md mx-auto">
                        Munkanapokon 9:00 és 17:00 között válaszolunk minden megkeresésre.
                    </p>
                </div>

                {/* Contact cards */}
                <div className="px-6 sm:px-10 py-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-dark-blue/30 hover:shadow-md transition-all">
                        <div className="shrink-0 w-11 h-11 rounded-lg bg-dark-blue/10 flex items-center justify-center text-dark-blue">
                            <PhoneIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-gray-500">Telefon</h2>
                            <a href="tel:+3612345678" className="block mt-1 font-semibold text-dark-gray hover:text-dark-blue transition-colors">
                                +36 1 234 5678
                            </a>
                            <p className="text-xs text-gray-400 mt-0.5">H–P · 9:00–17:00</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-dark-blue/30 hover:shadow-md transition-all">
                        <div className="shrink-0 w-11 h-11 rounded-lg bg-dark-blue/10 flex items-center justify-center text-dark-blue">
                            <EmailIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-gray-500">Általános e-mail</h2>
                            <a href="mailto:info@bookly.hu" className="block mt-1 font-semibold text-dark-gray hover:text-dark-blue transition-colors break-all">
                                info@bookly.hu
                            </a>
                            <p className="text-xs text-gray-400 mt-0.5">Ügyféltámogatás</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-dark-blue/30 hover:shadow-md transition-all">
                        <div className="shrink-0 w-11 h-11 rounded-lg bg-dark-blue/10 flex items-center justify-center text-dark-blue">
                            <EmailIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-gray-500">Üzleti e-mail</h2>
                            <a href="mailto:business@bookly.hu" className="block mt-1 font-semibold text-dark-gray hover:text-dark-blue transition-colors break-all">
                                business@bookly.hu
                            </a>
                            <p className="text-xs text-gray-400 mt-0.5">Partnerkapcsolat</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-dark-blue/30 hover:shadow-md transition-all">
                        <div className="shrink-0 w-11 h-11 rounded-lg bg-dark-blue/10 flex items-center justify-center text-dark-blue">
                            <LocationIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-gray-500">Iroda</h2>
                            <p className="mt-1 font-semibold text-dark-gray">Budapest, Magyarország</p>
                            <p className="text-xs text-gray-400 mt-0.5">Időpont egyeztetéssel</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
