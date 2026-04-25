import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import hi from "../assets/hi.png";

const API_BASE_URL = "https://api-z3zamhysqa-uc.a.run.app";
const NAVER_STATE_STORAGE_KEY = "lawhero_naver_oauth_state";
const NAVER_REDIRECT_URI_STORAGE_KEY = "lawhero_naver_redirect_uri";

const getNaverRedirectUri = () =>
  sessionStorage.getItem(NAVER_REDIRECT_URI_STORAGE_KEY) ||
  `${window.location.origin}/auth/naver/callback`;

export default function NaverCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.__naver_login_running__) {
      console.log("Naver login already running");
      return;
    }

    window.__naver_login_running__ = true;

    const login = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const oauthError = params.get("error");

        if (oauthError) {
          throw new Error("네이버 로그인이 취소되었습니다.");
        }

        if (!code || !state) {
          throw new Error("네이버 인증 정보가 없습니다.");
        }

        const savedState = sessionStorage.getItem(NAVER_STATE_STORAGE_KEY);

        if (!savedState || savedState !== state) {
          throw new Error("네이버 인증 상태값이 일치하지 않습니다.");
        }

        const res = await fetch(`${API_BASE_URL}/auth/naver/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            state,
            redirectUri: getNaverRedirectUri(),
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("NAVER EXCHANGE ERROR:", text);
          throw new Error("네이버 로그인 처리에 실패했습니다.");
        }

        const data = await res.json();
        const cred = await signInWithCustomToken(auth, data.firebaseToken);

        sessionStorage.removeItem(NAVER_STATE_STORAGE_KEY);
        sessionStorage.removeItem(NAVER_REDIRECT_URI_STORAGE_KEY);

        const uid = cred.user.uid;
        const snap = await getDoc(doc(db, "app_users", uid));

        if (!snap.exists()) {
          window.location.href = "/auth/nickname";
          return;
        }

        const userData = snap.data();

        if (!userData?.nickname?.trim()) {
          window.location.href = "/auth/nickname";
          return;
        }

        if (!userData?.phoneVerified) {
          window.location.href = "/auth/verify";
          return;
        }

        window.location.href = "/home";
      } catch (err) {
        console.error("Naver login error:", err);
        setError(err?.message || "네이버 로그인 중 문제가 발생했습니다.");
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
        padding: 40,
      }}
    >
      <img
        src={hi}
        style={{
          width: 120,
          marginBottom: 24,
        }}
      />

      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {error ? "네이버 로그인 실패" : "네이버 로그인 중입니다"}
      </div>

      <div
        style={{
          fontSize: 14,
          color: "#6B7280",
          lineHeight: 1.6,
        }}
      >
        {error || "잠시만 기다려 주세요"}
      </div>

      {error && (
        <button
          onClick={() => {
            window.location.href = "/auth";
          }}
          style={{
            marginTop: 24,
            border: "none",
            borderRadius: 14,
            background: "#111827",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            padding: "12px 18px",
          }}
          type="button"
        >
          로그인으로 돌아가기
        </button>
      )}
    </div>
  );
}
