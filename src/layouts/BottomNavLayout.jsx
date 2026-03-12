import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import pop from "../assets/pop.png"; // 배너 이미지

export default function BottomNavLayout() {

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {

    const hideDate = localStorage.getItem("bannerHideDate");
    const today = new Date().toISOString().slice(0, 10);

    if (hideDate !== today) {
      setShowBanner(true);
    }

  }, []);

  const handleHideToday = () => {

    const today = new Date().toISOString().slice(0, 10);

    localStorage.setItem("bannerHideDate", today);

    setShowBanner(false);

  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column"
      }}
    >

      {/* 페이지 */}
      <div style={{ flex: 1, paddingBottom: 88 }}>
        <Outlet />
      </div>

      {/* 하단 네비 */}
      <BottomNav />

      {/* 배너 */}
      {showBanner && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "center"
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: 720
            }}
          >

            {/* 배너 이미지 */}

            <img
              src={pop}
              style={{
                width: "100%",
                display: "block"
              }}
            />

            {/* 하단 컨트롤 */}

            <div
              style={{
                background: "#E5E5E5",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 14
              }}
            >

              <div
                onClick={handleHideToday}
                style={{
                  cursor: "pointer",
                  color: "#6B7280"
                }}
              >
                ✔ 오늘 하루 보지 않기
              </div>

              <div
                onClick={() => setShowBanner(false)}
                style={{
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                닫기
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );

}
