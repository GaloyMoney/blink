import copy from "copy-to-clipboard"
import Link from "next/link"
import { useRouter } from "next/router"
import React from "react"
import { Image, OverlayTrigger, Tooltip } from "react-bootstrap"

import { URL_HOST_DOMAIN } from "../../config/config"

import styles from "./app-layout.module.css"

type Props = {
  children: React.ReactPortal | React.ReactNode
  username: string | string[] | undefined
}

const AppLayout = ({ children, username }: Props) => {
  const router = useRouter()
  const { memo } = useRouter().query
  const [openSideBar, setOpenSideBar] = React.useState<boolean>(false)
  const [copied, setCopied] = React.useState<boolean>(false)
  const lightningAddr = username
    ? `${username?.toString().toLowerCase()}@${URL_HOST_DOMAIN}`
    : ""

  const cashRegisterLink = username ? `/${username}` : "#"
  const payCodeLink = username ? `/${username}/print?memo=${memo}` : "#"

  const copyToClipboard = () => {
    copy(lightningAddr)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const closeSideBar = () => {
    setOpenSideBar(false)
  }

  const navigateHome = () => {
    let pathname = "/"
    if (username) pathname = `/${username}`
    router.push(
      {
        pathname,
      },
      undefined,
      { shallow: true },
    )
    setTimeout(() => {
      router.reload() // Force a reload after a short delay to allow location href to update
    }, 200)
  }

  return (
    <div className={`${openSideBar && styles.container_bg} ${styles.container}`}>
      <nav className={styles.nav_bar}>
        <button className={styles.nav_home} onClick={navigateHome}>
          <Image src="/icons/blink-logo-icon.svg" alt="logo" width="50" height="50" />
        </button>
        <div onClick={() => setOpenSideBar(!openSideBar)} className={styles.hamburger}>
          <span className={`${openSideBar && styles.toggle}`}></span>
          <span className={`${openSideBar && styles.toggle}`}></span>
          <span className={`${openSideBar && styles.toggle}`}></span>
        </div>
        <ul className={`${openSideBar && styles.nav_menu_bg} ${styles.nav_menu}`}>
          <li>{`Ways to pay ${username ?? "user"} `}</li>
          <li onClick={closeSideBar}>
            <Link href={cashRegisterLink}>
              <>
                <Image
                  src="/register-black&white.svg"
                  width={"15"}
                  height={"15"}
                  alt="Cash register"
                />
                Cash Register App
              </>
            </Link>
          </li>
          <li onClick={closeSideBar}>
            <Link href={payCodeLink}>
              <>
                <Image
                  src="/paycode-black&white.svg"
                  width={"15"}
                  height={"15"}
                  alt="Paycode"
                />
                Printable Paycode
              </>
            </Link>
          </li>
          <div className={styles.lightning_addr}>
            <div>
              <Image src="/at-black&white.svg" width={"15"} height={"15"} alt="@" />
              <div>
                <p>Lightning address:</p>
                <p>{lightningAddr}</p>
              </div>
            </div>
            <div>
              <OverlayTrigger
                show={copied}
                placement="bottom"
                overlay={<Tooltip id="copy">Copied!</Tooltip>}
              >
                <button onClick={copyToClipboard}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 34 34"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.2779 26.6961H8.0999C6.06243 26.6939 4.10905 25.8836 2.66833 24.4429C1.22762 23.0021 0.417258 21.0488 0.415039 19.0113L0.415039 7.8333C0.417258 5.79583 1.22762 3.84244 2.66833 2.40173C4.10905 0.961022 6.06243 0.150657 8.0999 0.148438L19.2779 0.148438C21.3154 0.150657 23.2687 0.961022 24.7095 2.40173C26.1502 3.84244 26.9605 5.79583 26.9627 7.8333V19.0113C26.9605 21.0488 26.1502 23.0021 24.7095 24.4429C23.2687 25.8836 21.3154 26.6939 19.2779 26.6961ZM8.0999 4.34018C7.17347 4.34018 6.28498 4.70821 5.62989 5.36329C4.97481 6.01838 4.60678 6.90687 4.60678 7.8333V19.0113C4.60678 19.9377 4.97481 20.8262 5.62989 21.4813C6.28498 22.1364 7.17347 22.5044 8.0999 22.5044H19.2779C20.2043 22.5044 21.0928 22.1364 21.7479 21.4813C22.403 20.8262 22.771 19.9377 22.771 19.0113V7.8333C22.771 6.90687 22.403 6.01838 21.7479 5.36329C21.0928 4.70821 20.2043 4.34018 19.2779 4.34018H8.0999ZM33.949 25.9975V9.92917C33.949 9.37331 33.7282 8.84022 33.3351 8.44717C32.9421 8.05412 32.409 7.8333 31.8531 7.8333C31.2973 7.8333 30.7642 8.05412 30.3711 8.44717C29.9781 8.84022 29.7572 9.37331 29.7572 9.92917V25.9975C29.7572 26.924 29.3892 27.8124 28.7341 28.4675C28.079 29.1226 27.1906 29.4906 26.2641 29.4906H10.1958C9.63991 29.4906 9.10682 29.7115 8.71377 30.1045C8.32072 30.4976 8.0999 31.0307 8.0999 31.5865C8.0999 32.1424 8.32072 32.6755 8.71377 33.0685C9.10682 33.4616 9.63991 33.6824 10.1958 33.6824H26.2641C28.3016 33.6802 30.255 32.8698 31.6957 31.4291C33.1364 29.9884 33.9468 28.035 33.949 25.9975Z"
                      fill="#fff"
                    />
                  </svg>
                  Copy
                </button>
              </OverlayTrigger>
              <button>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 35 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_1229_33614)">
                    <path
                      d="M11.7861 9.44018L15.6717 5.55322L15.7011 24.5997C15.7011 25.7571 16.6394 26.6955 17.7968 26.6955C18.9543 26.6955 19.8926 25.7571 19.8926 24.5997L19.8633 5.577L23.7265 9.44024C24.5306 10.2728 25.8574 10.2958 26.69 9.49172C27.5225 8.68759 27.5456 7.36083 26.7414 6.52828C26.7245 6.5108 26.7074 6.49364 26.69 6.47681L22.2022 1.98902C19.7468 -0.466382 15.7659 -0.466382 13.3105 1.98896L13.3104 1.98902L8.82271 6.47674C8.01858 7.30929 8.04164 8.63605 8.87418 9.44018C9.68637 10.2246 10.974 10.2246 11.7861 9.44018Z"
                      fill="#fff"
                    />
                    <path
                      d="M32.384 20.4053C31.2265 20.4053 30.2882 21.3436 30.2882 22.5011V28.9155C30.2874 29.2308 30.0321 29.4862 29.7168 29.487H5.71026C5.39497 29.4862 5.13955 29.2308 5.13883 28.9155V22.5011C5.13883 21.3436 4.20051 20.4053 3.04305 20.4053C1.88559 20.4053 0.947266 21.3436 0.947266 22.5011V28.9155C0.950344 31.5448 3.08103 33.6755 5.71026 33.6785H29.7167C32.346 33.6755 34.4766 31.5448 34.4797 28.9155V22.5011C34.4798 21.3436 33.5414 20.4053 32.384 20.4053Z"
                      fill="#fff"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_1229_33614">
                      <rect
                        width="33.534"
                        height="33.534"
                        fill="white"
                        transform="translate(0.949219 0.148438)"
                      />
                    </clipPath>
                  </defs>
                </svg>
                Share
              </button>
            </div>
          </div>
        </ul>
      </nav>
      <div className={styles.divider}></div>
      <main className={`${openSideBar && styles.main_bg} ${styles.main}`}>
        {children}
        <div className={styles.footer}>
          <a href="https://galoy.io" target="_blank" rel="noreferrer">
            <span>Powered by</span>
            <Image
              src="/icons/galoy-logo-text-icon.svg"
              alt="Galoy logo"
              width={50}
              height={50}
            />
          </a>
        </div>
      </main>
    </div>
  )
}

export default AppLayout
