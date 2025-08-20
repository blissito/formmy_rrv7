import { cn } from "~/lib/utils";

interface AIMotivationProps {
  className?: string;
}

export const AIMotivation = ({ className }: AIMotivationProps) => {
  const words = "No necesitas ser programador".split(' ');
  const wordsAfterDev = "para tener un asistente virtual.".split(' ');
  const beforeEasy = "Configurarlo".split(' ');
  const afterEasy = "es muy fácil con un par de clics, y una vez activo".split(' ');
  const wordsAfterAsistente = "no se detiene nunca.".split(' ');
  
  return (
    <section className={cn("w-full my-20 md:my-40 bg-white", className)}>
        <p className="text-sm mb-4 md:text-xl text-center uppercase text-metal"> Fácil y rápido</p>
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-2 items-center">
        {/* First part - before Dev */}
        {words.map((word, index) => (
          <p key={`before-dev-${index}`} className="text-3xl md:text-7xl text-dark heading">
            {word}
          </p>
        ))}
        
        {/* Dev component */}
        <Dev />
        
        {/* After Dev, before Configurarlo */}
        {wordsAfterDev.map((word, index) => (
          <p key={`after-dev-${index}`} className="text-3xl md:text-7xl text-dark heading">
            {word}
          </p>
        ))}
        
        {/* Configurarlo */}
        {beforeEasy.map((word, index) => (
          <p key={`before-easy-${index}`} className="text-3xl md:text-7xl text-dark heading">
            {word}
          </p>
        ))}
        
        {/* Easy component */}
        <Easy />
        
        {/* After Easy, before Asistente */}
        {afterEasy.map((word, index) => (
          <p key={`after-easy-${index}`} className="text-3xl md:text-7xl text-dark heading">
            {word}
          </p>
        ))}
        
        {/* Asistente component */}
        <Asistente />
        
        {/* After Asistente */}
        {wordsAfterAsistente.map((word, index) => (
          <p key={`after-asistente-${index}`} className="text-3xl md:text-7xl text-dark heading">
            {word}
          </p>
        ))}
      </div>
    </section>
  );
};

const Dev = () => {
  return (
    <div className="w-[100px] hover:scale-90 transition-all cursor-pointer hover:rotate-3 h-10 md:w-[148px] md:h-[100px] bg-brand-500 rounded-2xl px-3 flex items-start md:items-end overflow-hidden">
   <img className="scale-[1.5]" src="/home/dev.svg" alt="ghosty" />
    </div>
  );
};

const Asistente = () => {
    return (
      <div className="w-16 hover:scale-90 transition-all cursor-pointer hover:rotate-3 h-10 md:w-[100px] md:h-[100px] bg-bird rounded-full overflow-hidden">
            <img className="w-[90%] mx-auto mt-4" src="/home/ghosty-outline.svg" alt="ghosty" />
      </div>
    );
  };

  const Easy = () => {
    return (
      <div className="w-[100px] hover:scale-90 transition-all cursor-pointer hover:-rotate-3 h-10 md:w-[148px] md:h-[100px] bg-cloud rounded-full flex items-start md:items-end pb-0 md:pb-2 overflow-hidden">
        <img className="scale-[1.9]" src="/home/girl.svg" alt="ghosty" />
      </div>
    );
  };