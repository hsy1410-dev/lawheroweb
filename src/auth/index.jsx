import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  onAuthStateChanged
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function AuthLanding() {

  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  /* 이미 로그인 상태면 홈으로 이동 */
  useEffect(() => {

    const guest = localStorage.getItem("guest");

    const unsub = onAuthStateChanged(auth, (user) => {

      if (user) {
        nav("/home");
        return;
      }

      if (guest) {
        nav("/home");
      }

    });

    return unsub;

  }, [nav]);

  /* ===============================
     🔵 Google 로그인
  =============================== */

  const handleGoogleLogin = async () => {

    if (loading) return;
    setLoading(true);

    try {

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const uid = result.user.uid;

      const snap = await getDoc(doc(db, "app_users", uid));

      if (!snap.exists()) {
        nav("/auth/nickname");
        return;
      }

      const data = snap.data();

      if (!data?.nickname?.trim()) {
        nav("/auth/nickname");
        return;
      }

      if (!data?.phoneVerified) {
        nav("/auth/verify");
        return;
      }

      nav("/home");

    } catch (e) {

      console.error("GOOGLE LOGIN ERROR:", e);
      alert("구글 로그인 실패");

    } finally {

      setLoading(false);

    }
  };

  /* ===============================
     🟡 Kakao 로그인
  =============================== */

  const handleKakaoLogin = () => {

    const redirectUri =
      "https://lawheroweb.vercel.app/auth/kakao/callback";

    const url =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=a1fbf977caeea589545f32274a254ab1` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;

    window.location.href = url;
  };

  return (
    <div
      style={{
        background: "#F3F4F6",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div
        style={{
          background: "white",
          width: "100%",
          maxWidth: 420,
          padding: 40,
          borderRadius: 16,
          boxShadow: "0 8px 20px rgba(0,0,0,0.06)"
        }}
      >

        <h1
          style={{
            textAlign: "center",
            fontSize: 24,
            marginBottom: 10,
            fontWeight: 700
          }}
        >
          LawHero
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6B7280",
            marginBottom: 30
          }}
        >
          당신에게 맞는 전문가와 연결됩니다
        </p>

        {/* Google 로그인 */}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            background: "#111827",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 12,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "로그인 중..." : "Google로 시작하기"}
        </button>

        {/* Kakao 로그인 */}

        <button
          onClick={handleKakaoLogin}
          style={{
            width: "100%",
            padding: 14,
            background: "#FEE500",
            color: "#191919",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 12
          }}
        >
          카카오로 시작하기
        </button>

        {/* 나중에 가입 */}

        <button
          onClick={() => {
            localStorage.setItem("guest", "true");
            nav("/home");
          }}
          style={{
            width: "100%",
            padding: 14,
            background: "#F3F4F6",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            cursor: "pointer"
          }}
        >
          나중에 가입
        </button>

        <p
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 13,
            color: "#9CA3AF"
          }}
        >
          로그인하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
        </p>

      </div>
    </div>
  );
}