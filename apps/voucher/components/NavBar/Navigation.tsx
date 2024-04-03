import Navbar from "./NavBar";
import React from "react";


const Navigation = () => {
  const nav_items = {
    loged_in: [
      { name: "Profile", link: "/#" },
      { name: "Settings", link: "/#" },
      { name: "Logout", link: "/#" },
    ],
    loged_out: [{ name: "Login", link: "/#" }],
    default: [
      { name: "About", link: "/#" },
      { name: "How it works", link: "/#" },
      { name: "Help", link: "/#" },
    ],
  };

  return (
    <div>
      <Navbar nav_items={nav_items} />
    </div>
  );
};

export default Navigation;
