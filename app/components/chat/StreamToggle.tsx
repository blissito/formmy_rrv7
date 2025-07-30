interface StreamToggleProps {
  stream: boolean;
  onToggle: (stream: boolean) => void;
}

export const StreamToggle = ({ stream, onToggle }: StreamToggleProps) => {
  return (
    <article className="flex items-center justify-end px-4 pt-4 pb-2">
      <label className="flex items-center gap-2 text-xs text-metal cursor-pointer select-none">
        <input
          type="checkbox"
          checked={stream}
          onChange={() => onToggle(!stream)}
          className="accent-brand-500 rounded-md bg-transparent checked:focus:bg-brand-500 checked:bg-brand-500 checked:hover:bg-brand-500 checked:border-brand-500 focus:ring-brand-500 hover:bg-brand-500"
        />
        Modo stream (effecto de escritura)
      </label>
    </article>
  );
};
