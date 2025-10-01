interface QuoteProps {
  beforeHighlight?: string;
  highlightText: string;
  afterHighlight?: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
  highlightStyle?: React.CSSProperties;
  className?: string;
}

export function Quote({
  beforeHighlight = "Nunca pensé que integrar un chatbot IA fuera",
  highlightText = "tan fácil",
  afterHighlight = ", Formmy lo hizo en minutos.",
  authorName = "Rosalba Flores",
  authorTitle = "Collectum Datos",
  authorImage = "https://i.imgur.com/RAiyJBc.jpg",
  highlightStyle,
  className = ""
}: QuoteProps) {
  const defaultHighlightStyle: React.CSSProperties = {
    fontFamily: 'Kablammo, system-ui, sans-serif',
    background: '#9A99EA',
    color: '#191A20',
    padding: '8px 16px',
    borderRadius: '12px',
    display: 'inline-block',
    transform: 'rotate(-2deg)',
    boxShadow: '0 4px 8px rgba(138, 215, 201, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)',
    margin: '0 8px'
  };

  return (
    <section className={`flex flex-col items-center text-center max-w-6xl px-4 md:px-[5%] xl:px-0 mx-auto 0 py-16 lg:py-32 ${className}`}>
      <h3 className="text-4xl md:text-5xl lg:text-7xl heading leading-[1.2]">
        "{beforeHighlight}{" "}
        <span style={{ ...defaultHighlightStyle, ...highlightStyle }}>
          {highlightText}
        </span>
        {afterHighlight}"
      </h3>
      <div className="border flex gap-2 border-outlines pl-2 py-2 pr-4 rounded-full mt-8 md:mt-14">
        {authorImage && (
          <img
            className="w-10 md:w-14 h-10 md:h-14 rounded-full object-contain"
            src={authorImage}
            alt={authorName}
          />
        )}
        <div className="text-left flex flex-col items-left justify-center">
          <h3 className="heading text-sm md:text-base text-dark">{authorName}</h3>
          {authorTitle && (
            <p className="text-metal text-xs md:text-sm">{authorTitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}