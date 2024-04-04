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
    default: [],
  }

  return (
    <div>
      <Navbar nav_items={nav_items} />
    </div>
  )
}

export default Navigation
