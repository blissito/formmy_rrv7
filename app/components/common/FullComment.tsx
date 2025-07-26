import { FaQuoteLeft } from "react-icons/fa";
import { cn } from "~/lib/utils";

export const FullComment = ({
    className,
    image,
    comment,
    client,
    clientCompany,
    logo,
  }: {
    className: string;
    image: string;
    comment: string;
    client: string;
    clientCompany: string;
    logo?: string;
  }) => {
    return (
      <div
        className={cn(
          "rounded-[40px] overflow-hidden flex flex-wrap md:flex-nowrap p-6 md:p-12 bg-[#B2E7CA] flex gap-10 my-20 md:my-40",
          className
        )}
      >
        <img
          className="w-full md:w-[46%] rounded-3xl md:rounded-[40px] "
          src={
            image
              ? image
              : "https://images.pexels.com/photos/925786/pexels-photo-925786.jpeg"
          }
        />
        <div className="w-full md:w-[56%]">
          <FaQuoteLeft className="text-dark text-4xl md:text-5xl mb-6 leading-tight" />
          <p className="text-dark text-lg md:text-2xl">{comment}</p>
          <div className="mt-8">
            <img src={logo} />
            <div>
              <h3 className="heading text-xl">{client}</h3>
              <p className="text-gray-600">{clientCompany}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  