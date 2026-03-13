import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function PhoneInfoScreen() {

  const nav = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);

  const isValid =
    name.length >= 2 &&
    phone.length >= 10 &&
    agree;

  const handleVerify = async () => {

    const user = auth.currentUser;
    if (!user) return;

    try {

      await setDoc(
        doc(db, "app_users", user.uid),
        {
          realName: name,
          phoneInput: phone,
          policyAgree: true
        },
        { merge: true }
      );

      nav("/auth/verify");

    } catch (error) {

      console.log("❌ Firestore 에러:", error);

    }

  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F9FAFB",
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
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          본인 확인을 위해
          <br />
          정보를 입력해 주세요
        </h1>

        {/* 이름 */}

        <p style={{ marginTop: 20, marginBottom: 6 }}>
          이름
        </p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          style={{
            border: "none",
            borderBottom: "1px solid #D1D5DB",
            padding: "8px 0",
            fontSize: 16,
            width: "100%",
            outline: "none",
          }}
        />

        {/* 전화번호 */}

        <p style={{ marginTop: 20, marginBottom: 6 }}>
          전화번호
        </p>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01012345678"
          type="tel"
          style={{
            border: "none",
            borderBottom: "1px solid #D1D5DB",
            padding: "8px 0",
            fontSize: 16,
            width: "100%",
            outline: "none",
          }}
        />

        {/* 개인정보 동의 */}

        <div
          onClick={() => setAgree(!agree)}
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 30,
            cursor: "pointer",
          }}
        >

          <div
            style={{
              width: 18,
              height: 18,
              border: "1px solid #9CA3AF",
              borderRadius: 4,
              marginRight: 10,
              background: agree ? "#7C3AED" : "transparent",
            }}
          />

          <span style={{ fontSize: 14 }}>
            개인정보 제3자 제공에 동의합니다
          </span>

        </div>

        {/* 정책 보기 */}

        <div
          onClick={() =>
            window.open("https://lawhero.kr/policy")
          }
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#7C3AED",
            cursor: "pointer",
          }}
        >
          개인정보 처리방침 보기
        </div>

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
          disabled={!isValid}
          onClick={handleVerify}
          style={{
            width: "100%",
            padding: 18,
            borderRadius: 16,
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: isValid ? "#7C3AED" : "#E5E7EB",
            color: isValid ? "#fff" : "#9CA3AF",
            cursor: "pointer",
          }}
        >
          본인확인 시작
        </button>

      </div>

    </div>
  );
}
