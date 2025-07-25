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
          "rounded-[40px] col-span-1 p-12 bg-[#BBF0FF] flex gap-10 my-20 md:my-40",
          className
        )}
      >
        <img
          className="w-[46%] rounded-[40px]"
          src={
            image
              ? image
              : "https://images.pexels.com/photos/925786/pexels-photo-925786.jpeg"
          }
        />
        <div>
          <FaQuoteLeft className="text-brand-500 text-5xl mb-6" />
          <p className="text-dark  text-2xl">{comment}</p>
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
  