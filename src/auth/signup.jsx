import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

export default function NicknameScreen() {

  const nav = useNavigate();

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmed = nickname.trim();
  const normalized = trimmed.toLowerCase();

  const isValid =
    trimmed.length >= 2 &&
    trimmed.length <= 12 &&
    !trimmed.includes(" ");

  const handleNext = async () => {

    if (!isValid) return;

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    const nicknameRef = doc(db, "nickname_map", normalized);
    const userRef = doc(db, "app_users", user.uid);

    try {

      await runTransaction(db, async (transaction) => {

        const nicknameSnap = await transaction.get(nicknameRef);

        if (nicknameSnap.exists()) {
          throw new Error("이미 사용 중인 닉네임입니다.");
        }

        transaction.set(nicknameRef, {
          uid: user.uid,
          nickname: trimmed,
          createdAt: new Date(),
        });

        transaction.set(
          userRef,
          {
            nickname: trimmed,
            nicknameLower: normalized,
            phoneVerified: false,
            createdAt: new Date(),
          },
          { merge: true }
        );

        const couponRef = doc(
          collection(db, "app_users", user.uid, "coupons")
        );

        transaction.set(couponRef, {
          type: "consult_support",
          title: "상담지원 쿠폰",
          used: false,
          createdAt: serverTimestamp(),
          usedAt: null,
          issuedBy: "signup",
        });

      });

      nav("/auth/phone");

    } catch (error) {

      alert(
        error.message || "닉네임 설정 중 오류가 발생했습니다."
      );

    }

    setLoading(false);
  };

  return (
    <div
      style={{
        background: "#F9FAFB",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >

      <div
        style={{
          padding: "120px 24px 0",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >

        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            lineHeight: "40px",
            marginBottom: 48,
            color: "#111827",
          }}
        >
          사용할 닉네임을
          <br />
          입력해 주세요
        </h1>

        <p
          style={{
            fontSize: 14,
            marginBottom: 8,
            color: "#6B7280",
          }}
        >
          닉네임
        </p>

        <input
          placeholder="닉네임을 입력해 주세요"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={12}
          style={{
            border: "none",
            borderBottom: "1px solid #D1D5DB",
            fontSize: 18,
            padding: "8px 0",
            width: "100%",
            outline: "none",
          }}
        />

        {!isValid && nickname.length > 0 && (
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#EF4444",
            }}
          >
            닉네임은 2~12자, 공백 없이 입력해주세요.
          </p>
        )}

      </div>

      <div
        style={{
          padding: 24,
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >

        <button
          onClick={handleNext}
          disabled={!isValid || loading}
          style={{
            width: "100%",
            padding: 18,
            borderRadius: 16,
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            background:
              isValid && !loading ? "#7C3AED" : "#E5E7EB",
            color:
              isValid && !loading ? "#fff" : "#9CA3AF",
            cursor: "pointer",
          }}
        >
          {loading ? "확인 중..." : "다음"}
        </button>

      </div>

    </div>
  );
}
