import { colorMap } from "@/components/transaction-details/index.types";

export  const getStatusColor = (status: string): string => {
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
