export function HighlightBadge({
  highlightText,
  normalText,
}: {
  highlightText: string;
  normalText: string;
}) {
  return (
    <div className="bg-outlines/40 text-metal text-sm w-fit rounded-full p-2 mb-6">
      <span className="text-dark font-semibold">{highlightText}</span> {normalText}
    </div>
  );
}
