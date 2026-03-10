import { useNavigate, useLocation } from "react-router-dom";
import {
  IoHomeOutline,
  IoHome,
  IoChatbubbleOutline,
  IoChatbubble,
  IoPersonOutline,
  IoPerson,
  IoPeopleOutline,
  IoPeople
} from "react-icons/io5";

export default function BottomNav() {

  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (menu) => {
    navigate(menu.path);
  };

  const menus = [
    {
      label: "홈",
      path: "/home",
      icon: IoHomeOutline,
      activeIcon: IoHome
    },
    {
      label: "커뮤니티",
      path: "/community",
      icon: IoPeopleOutline,
      activeIcon: IoPeople
    },
    {
      label: "상담",
      path: "/chat",
      icon: IoChatbubbleOutline,
      activeIcon: IoChatbubble,
      highlight: true
    },
    {
      label: "내정보",
      path: "/mypage",
      icon: IoPersonOutline,
      activeIcon: IoPerson
    }
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "#FFFFFF",
        borderTop: "1px solid #E5E7EB",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000
      }}
    >
      {menus.map((menu) => {

        const active = location.pathname.startsWith(menu.path);
        const Icon = active ? menu.activeIcon : menu.icon;

        return (
          <button
            key={menu.path}
            onClick={() => handleMenuClick(menu)}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              color: active ? "#4F46E5" : "#9CA3AF",
              transform: menu.highlight ? "translateY(-4px)" : "none"
            }}
          >

            <Icon size={menu.highlight ? 22 : 24} />

            <span
              style={{
                fontSize: 11,
                marginTop: 4,
                fontWeight: active ? 700 : 500
              }}
            >
              {menu.label}
            </span>

          </button>
        );

      })}
    </nav>
  );
}