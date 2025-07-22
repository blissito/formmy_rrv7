interface StreamToggleProps {
  stream: boolean;
  onToggle: (stream: boolean) => void;
}

export const StreamToggle = ({ stream, onToggle }: StreamToggleProps) => {
  return (
    <article className="flex items-center justify-end px-4 pt-4 pb-2">
      <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={stream}
          onChange={() => onToggle(!stream)}
          className="accent-brand-500 rounded-md"
        />
        Modo stream (effecto de escritura)
      </label>
    </article>
  );
};
