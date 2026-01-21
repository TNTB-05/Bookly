export default function Card({title,description,imageUrl}){
    return(
        <div className="card bg-base-blue rounded-lg shadow-md overflow-hidden w-full hover:shadow-xl hover:scale-105 transition-all duration-300">
            <img src={imageUrl} alt={`${title}-image`} className="w-full h-56 sm:h-64 md:h-72 lg:h-60 xl:h-72 2xl:h-80 object-cover" />
            <div className="p-3 sm:p-4 lg:p-3 xl:p-5 2xl:p-6 bg-base-blue">
                <h2 className="text-lg sm:text-xl lg:text-base xl:text-xl 2xl:text-2xl font-semibold mb-2">{title}</h2>
                <p className="text-gray-700 text-sm sm:text-base lg:text-xs xl:text-sm 2xl:text-base">{description}</p>
            </div>
        </div>
    )
}