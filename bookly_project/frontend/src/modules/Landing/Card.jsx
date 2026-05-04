import RightArrowIcon from '../../icons/RightArrowIcon';

export default function Card({ title, description, imageUrl }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:ring-2 hover:ring-dark-blue/20 transition-all duration-300 group shadow-sm hover:shadow-md">
            <div className="flex">
                <div className="w-1 bg-dark-blue shrink-0" />
                <div className="flex-1">
                    <div className="h-40 overflow-hidden bg-gray-50">
                        <img src={imageUrl} alt={`${title}-image`} className="w-full h-full object-cover transition-transform duration-500" />
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-start">
                            <h3 className="text-base font-bold text-dark-gray leading-snug">{title}</h3>
                            <span className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-dark-blue">
                                <RightArrowIcon className="w-4 h-4" />
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed mt-2">{description}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}