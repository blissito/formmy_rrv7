import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@headlessui/react";
import { FaCode, FaEye, FaProjectDiagram, FaRegFileAlt } from "react-icons/fa";
import { cn } from "~/lib/utils";

const tabContent = [
    {
      id: "journey",
      title: "Atención al cliente",
      icon: FaProjectDiagram,
      content: {
        heading: "User-journey mapping",
        text: "Auto-captured Journeys give you the insights you need to steer your product experience. Rally your team around one clear view that tracks your product's past, present, and future.",
        buttonText: "Learn more",
        image:
          "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
    },
    {
      id: "friction",
      title: "Cotizaciones en línea",
      icon: FaEye,
      content: {
        heading: "Uncover Friction",
        text: "Discover where users struggle and drop off. Pinpoint confusing workflows, broken elements, and frustrating interactions to improve your product's usability.",
        buttonText: "Start Analyzing",
        image:
          "https://images.pexels.com/photos/3184431/pexels-photo-3184431.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
    },
    {
      id: "docs",
      title: "Sistema de tickets",
      icon: FaRegFileAlt,
      content: {
        heading: "Product Documentation",
        text: "Create a single source of truth for your team. Centralize product specs, design assets, and user feedback to build better products, faster.",
        buttonText: "Explore Docs",
        image:
          "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
    },
    {
      id: "truth",
      title: "Seguimiento de envíos",
      icon: FaCode,
      content: {
        heading: "Source of Truth",
        text: "Ensure data consistency across your entire organization. Integrate with your existing tools to create a unified view of your product and users.",
        buttonText: "Learn about Integrations",
        image:
          "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
    },
    {
      id: "ventas",
      title: "Ventas",
      icon: FaCode,
      content: {
        heading: "Source of Truth",
        text: "Ensure data consistency across your entire organization. Integrate with your existing tools to create a unified view of your product and users.",
        buttonText: "Learn about Integrations",
        image:
          "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
    },
  ];
  

export const ChatTypes=()=>{
    return(
        <section className="w-full max-w-7xl mx-auto my-20 md:my-40 px-4">
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-dark mb-16">
        Para que puedes usar Formmy Chat
        </h3>
        <ChatExample />
    </section>
    )
}



export const ChatExample = () => {
    const [activeTab, setActiveTab] = useState(tabContent[0].id);
    const activeContent = tabContent.find((tab) => tab.id === activeTab)?.content;
  
    return (
      <div className="w-full bg-clear rounded-[40px]  border border-gray-300 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabContent.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 p-4 md:p-6 text-gray-600 focus:outline-none transition-colors duration-300",
                {
                  "text-brand-500 border-b-2 border-brand-500":
                    activeTab === tab.id,
                  "hover:bg-gray-100": activeTab !== tab.id,
                }
              )}
            >
              <tab.icon className="text-xl" />
              <span className="hidden md:inline">{tab.title}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="py-8 px-4 min-h-[60vh]"
          >
            {activeContent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-12">
                <div className="flex flex-col items-start">
                  <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
                    {activeContent.heading}
                  </h2>
                  <p className="text-gray-600 text-lg mb-6">
                    {activeContent.text}
                  </p>
                  <Button>{activeContent.buttonText}</Button>
                </div>
                <div>
                  <img
                    src={activeContent.image}
                    alt={activeContent.heading}
                    className="rounded-lg shadow-lg object-cover w-full h-full max-h-[300px]"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };