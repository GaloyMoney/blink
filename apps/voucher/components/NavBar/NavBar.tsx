import { useRef, useState } from "react"
import Link from "next/link"
import AddIcon from "@mui/icons-material/Add"
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle"
import MenuIcon from "@mui/icons-material/Menu"

import styles from "./NavBar.module.css"

interface NavItem {
  name: string
  link: string
}

interface NavigationProps {
  nav_items: {
    logged_in: NavItem[]
    logged_out: NavItem[]
    default: NavItem[]
  }
}

const Navbar: React.FC<NavigationProps> = ({ nav_items }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible)
  }

  const showNavbar = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const login = true // Replace with your login logic

  const navLinks = login ? nav_items.logged_in : nav_items.logged_out
  const defaultLinks = nav_items.default

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <h3>Galoy Withdraw</h3>
        </div>
        <nav className={styles.nav}>
          {defaultLinks.map((link) => (
            <Link key={link.name} className={styles.nav_item} href={link.link}>
              {link.name}
            </Link>
          ))}
        </nav>
        <div className={styles.right_section}>
          <Link href={`/create`}>
            <button className={styles.add_new_button}>
              <AddIcon />
              New Link
            </button>
          </Link>
          {login ? (
            <div>
              <div className={styles.dropdown}>
                <ArrowDropDownCircleIcon onClick={toggleDropdown} />

                {dropdownVisible && (
                  <div className={styles.dropdown_content}>
                    {navLinks.map((link) => (
                      <Link key={link.name} href={link.link}>
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {navLinks.map((link) => (
                <Link key={link.name} href={link.link}>
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className={styles.mobile_menu}>
          <MenuIcon onClick={showNavbar} />
        </div>
      </header>
      {mobileMenuOpen ? (
        <div ref={mobileMenuRef} className={styles.responsive_nav}>
          <Link
            key="Create Link"
            className={styles.nav_item}
            onClick={showNavbar}
            href={`/create`}
          >
            {"Create Link"}
          </Link>

          {defaultLinks.map((link) => (
            <Link
              key={link.name}
              className={styles.nav_item}
              onClick={showNavbar}
              href={link.link}
            >
              {link.name}
            </Link>
          ))}

          {login ? (
            <div>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  className={styles.nav_item}
                  onClick={showNavbar}
                  href={link.link}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          ) : (
            <div>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  className={styles.nav_item}
                  onClick={showNavbar}
                  href={link.link}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default Navbar
