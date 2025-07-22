export const Avatar = ({ primaryColor }: { primaryColor?: string }) => {
  return (
    <img
      style={{
        borderColor: primaryColor,
      }}
      className="border rounded-full border-gray-300 p-2"
      src={"/assets/chat/receipt.svg"}
      alt="avatar"
    />
  );
};
