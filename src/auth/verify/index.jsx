import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";

export default function VerifyScreen() {

  const nav = useNavigate();

  useEffect(() => {

    const user = auth.currentUser;

    if (!user) {
      nav("/auth/login");
      return;
    }

    const url =
      "https://api-6g2eamnopq-uc.a.run.app/kmc/start?uid=" +
      user.uid +
      "&platform=web";

    // 🔥 바로 KMC 인증 페이지 이동
    window.location.href = url;

  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p style={{ fontSize: 16 }}>
        본인 인증 페이지로 이동 중입니다...
      </p>
    </div>
  );
}