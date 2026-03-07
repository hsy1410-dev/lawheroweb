import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function VerifyScreen() {

  const nav = useNavigate();

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (user) => {

      if (!user) {
        nav("/auth/login");
        return;
      }

      const url =
        "https://api-6g2eamnopq-uc.a.run.app/kmc/start?uid=" +
        user.uid +
        "&platform=web";

      // 🔥 KMC 인증 이동
      window.location.href = url;

    });

    return () => unsub();

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