import { useEffect } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import hi from "../assets/hi.png"
export default function KakaoCallback() {

  console.log("🔥 KakaoCallback mounted");

  useEffect(() => {

    // ⭐ StrictMode 중복 실행 방지
    if (window.__kakao_login_running__) {
      console.log("⚠️ Kakao login already running");
      return;
    }

    window.__kakao_login_running__ = true;

    const login = async () => {
      try {

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          console.error("Kakao code 없음");
          return;
        }

        console.log("🔥 Kakao exchange start");

        const res = await fetch(
          "https://api-z3zamhysqa-uc.a.run.app/auth/kakao/exchange",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              redirectUri: "https://lawhero.kr/auth/kakao/callback"
            }),
          }
        );

        if (!res.ok) {
          const text = await res.text();
          console.error("KAKAO EXCHANGE ERROR:", text);
          return;
        }

        const data = await res.json();

        console.log("🔥 firebaseToken 받음");

        const cred = await signInWithCustomToken(auth, data.firebaseToken);

        console.log("🔥 Firebase 로그인 완료");

        const uid = cred.user.uid;

        const snap = await getDoc(doc(db, "app_users", uid));

        // ⭐ 신규 유저
        if (!snap.exists()) {
          window.location.href = "/auth/nickname";
          return;
        }

        const userData = snap.data();

        // ⭐ 닉네임 없음
        if (!userData?.nickname?.trim()) {
          window.location.href = "/auth/nickname";
          return;
        }

        // ⭐ 본인인증 안됨
        if (!userData?.phoneVerified) {
          window.location.href = "/auth/verify";
          return;
        }

        // ⭐ 정상 유저
        window.location.href = "/home";

      } catch (err) {
        console.error("🔥 Kakao login error:", err);
      }
    };

    login();

  }, []);

  return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: 40
    }}
  >

    <img
      src={hi}
      style={{
        width: 120,
        marginBottom: 24
      }}
    />

    <div
      style={{
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 8
      }}
    >
      카카오 로그인 중입니다
    </div>

    <div
      style={{
        fontSize: 14,
        color: "#6B7280"
      }}
    >
      잠시만 기다려 주세요
    </div>

  </div>
);
}
