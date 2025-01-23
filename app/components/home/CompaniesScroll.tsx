import { InfiniteMovingCards } from "../ui/infinite-scroll";

const companies = [
  {
    img: "https://i.imgur.com/AjBTHty.png",
    name: "fixterorg",
  },
  {
    img: "https://i.imgur.com/iqoX66G.png",
    name: "fixtergeek",
  },
  {
    img: "https://i.imgur.com/e4hOdkV.png",
    name: "surveyup",
  },
  {
    img: "https://i.imgur.com/MIB8mYa.png",
    name: "potentia",
  },
  {
    img: "https://i.imgur.com/9S7Jamw.png",
    name: "collectum",
  },
  // {
  //   img: "https://i.imgur.com/tVnMwtP.png",
  //   name: "english4pros",
  // },
];

export const CompaniesScroll = () => {
  return (
    <InfiniteMovingCards items={companies} direction="left" speed="normal" />
  );
};
