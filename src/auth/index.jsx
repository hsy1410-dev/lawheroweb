import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../firebase/firebase";

export default function AuthLanding() {

  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  /* 테스트 로그인 */
  const handleTestLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        "test@lawhero.com",
        "lawhero1234"
      );

      nav("/home");

    } catch (e) {
      alert("테스트 로그인 실패");
    }
  };

  /* 구글 로그인 */
  const handleGoogleLogin = async () => {

    if (loading) return;
    setLoading(true);

    try {

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const uid = result.user.uid;

      const snap = await getDoc(doc(db, "app_users", uid));

      if (!snap.exists()) {
        nav("/signup");
        return;
      }

      const data = snap.data();

      if (!data?.nickname?.trim()) {
        nav("/signup");
        return;
      }

      if (!data?.phoneVerified) {
        nav("/verify");
        return;
      }

      nav("/home");

    } catch (e) {
      console.log("GOOGLE LOGIN ERROR:", e);
      alert("구글 로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>

      <h1 style={{ textAlign: "center" }}>
        당신에게 맞는 전문가와 연결됩니다
      </h1>

      <img
        src="/auth_cards.png"
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "60px auto",
          display: "block"
        }}
      />

      <button
        onClick={handleTestLogin}
        style={{
          padding: 16,
          width: "100%",
          marginBottom: 16
        }}
      >
        테스트 로그인
      </button>

      <button
        onClick={handleGoogleLogin}
        style={{
          padding: 16,
          width: "100%",
          marginBottom: 16
        }}
      >
        구글로 시작하기
      </button>

      <button
        onClick={() => nav("/home")}
        style={{
          padding: 16,
          width: "100%"
        }}
      >
        나중에 가입
      </button>

    </div>
  );
}