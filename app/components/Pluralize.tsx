export const Pluralize = ({
  isPlural,
  singleWord,
  pluralWord,
}: {
  isPlural?: boolean;
  singleWord?: string;
  pluralWord?: string;
}) => {
  return <span>{isPlural ? pluralWord : singleWord}</span>;
};
