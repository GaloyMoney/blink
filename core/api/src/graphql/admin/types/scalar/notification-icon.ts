import { Icon } from "@/domain/notifications"
import { GT } from "@/graphql/index"

const NotificationIcon = GT.Enum({
  name: "NotificationIcon",
  values: {
    ARROW_RIGHT: {
      value: Icon.ArrowRight,
    },
    ARROW_LEFT: {
      value: Icon.ArrowLeft,
    },
    BACKSPACE: {
      value: Icon.BackSpace,
    },
    BANK: {
      value: Icon.Bank,
    },
    BITCOIN: {
      value: Icon.Bitcoin,
    },
    BOOK: {
      value: Icon.Book,
    },
    BTC_BOOK: {
      value: Icon.BtcBook,
    },
    CARET_DOWN: {
      value: Icon.CaretDown,
    },
    CARET_LEFT: {
      value: Icon.CaretLeft,
    },
    CARET_RIGHT: {
      value: Icon.CaretRight,
    },
    CARET_UP: {
      value: Icon.CaretUp,
    },
    CHECK_CIRCLE: {
      value: Icon.CheckCircle,
    },
    CHECK: {
      value: Icon.Check,
    },
    CLOSE: {
      value: Icon.Close,
    },
    CLOSE_CROSS_WITH_BACKGROUND: {
      value: Icon.CloseCrossWithBackground,
    },
    COINS: {
      value: Icon.Coins,
    },
    PEOPLE: {
      value: Icon.People,
    },
    COPY_PASTE: {
      value: Icon.CopyPaste,
    },
    DOLLAR: {
      value: Icon.Dollar,
    },
    EYE_SLASH: {
      value: Icon.EyeSlash,
    },
    EYE: {
      value: Icon.Eye,
    },
    FILTER: {
      value: Icon.Filter,
    },
    GLOBE: {
      value: Icon.Globe,
    },
    GRAPH: {
      value: Icon.Graph,
    },
    IMAGE: {
      value: Icon.Image,
    },
    INFO: {
      value: Icon.Info,
    },
    LIGHTNING: {
      value: Icon.Lightning,
    },
    LINK: {
      value: Icon.Link,
    },
    LOADING: {
      value: Icon.Loading,
    },
    MAGNIFYING_GLASS: {
      value: Icon.MagnifyingGlass,
    },
    MAP: {
      value: Icon.Map,
    },
    MENU: {
      value: Icon.Menu,
    },
    PENCIL: {
      value: Icon.Pencil,
    },
    NOTE: {
      value: Icon.Note,
    },
    RANK: {
      value: Icon.Rank,
    },
    QR_CODE: {
      value: Icon.QrCode,
    },
    QUESTION: {
      value: Icon.Question,
    },
    RECEIVE: {
      value: Icon.Receive,
    },
    SEND: {
      value: Icon.Send,
    },
    SETTINGS: {
      value: Icon.Settings,
    },
    SHARE: {
      value: Icon.Share,
    },
    TRANSFER: {
      value: Icon.Transfer,
    },
    USER: {
      value: Icon.User,
    },
    VIDEO: {
      value: Icon.Video,
    },
    WARNING: {
      value: Icon.Warning,
    },
    WARNING_WITH_BACKGROUND: {
      value: Icon.WarningWithBackground,
    },
    PAYMENT_SUCCESS: {
      value: Icon.PaymentSuccess,
    },
    PAYMENT_PENDING: {
      value: Icon.PaymentPending,
    },
    PAYMENT_ERROR: {
      value: Icon.PaymentError,
    },
    BELL: {
      value: Icon.Bell,
    },
    REFRESH: {
      value: Icon.Refresh,
    },
  },
})

export default NotificationIcon
