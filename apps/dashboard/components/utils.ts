import { colorMap } from "@/components/transaction-details/index.types";

export const openSidebar = () => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "hidden";
    document.documentElement.style.setProperty("--SideNavigation-slideIn", "1");
  }
};

export const closeSidebar = () => {
  if (typeof document !== "undefined") {
    document.documentElement.style.removeProperty("--SideNavigation-slideIn");
    document.body.style.removeProperty("overflow");
  }
};

export const toggleSidebar = () => {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const slideIn = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--SideNavigation-slideIn");
    if (slideIn) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
};

export const getTransactionStatusColor = (status: string): string => {
  switch (status) {
    case "ALREADY_PAID":
    case "SUCCESS":
      return colorMap.success;
    case "FAILURE":
      return colorMap.danger;
    case "PENDING":
    default:
      return colorMap.neutral;
  }
};
