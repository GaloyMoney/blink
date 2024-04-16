import React from "react"

import Navbar from "./NavBar"

const Navigation = () => {
  const nav_items = {
    logged_in: [
      { name: "Profile", link: "/#" },
      { name: "Settings", link: "/#" },
      { name: "Logout", link: "/#" },
    ],
    logged_out: [{ name: "Login", link: "/#" }],
    default: [
      { name: "About", link: "/#" },
      { name: "How it works", link: "/#" },
      { name: "Help", link: "/#" },
    ],
  }

  return (
    <div>
      <Navbar nav_items={nav_items} />
    </div>
  )
}

export default Navigation
