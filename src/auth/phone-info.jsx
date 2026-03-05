import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function PhoneInfoScreen() {

  const nav = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isValid = name.length >= 2 && phone.length >= 10;

  const handleVerify = async () => {

    console.log("🔥 handleVerify 진입");

    const user = auth.currentUser;
    console.log("👤 현재 user:", user?.uid);

    if (!user) {
      console.log("❌ user가 null임");
      return;
    }

    try {

      console.log("📝 Firestore 저장 시도");

      await setDoc(
        doc(db, "app_users", user.uid),
        {
          realName: name,
          phoneInput: phone,
        },
        { merge: true }
      );

      console.log("✅ Firestore 저장 완료");

      console.log("➡️ /auth/verify 이동");

      nav("/verify");

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

        <p style={{ marginTop: 20, marginBottom: 6 }}>
          이름
        </p>

        <input
          value={name}
          onChange={(e) => {
            console.log("✏️ 이름 입력:", e.target.value);
            setName(e.target.value);
          }}
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

        <p style={{ marginTop: 20, marginBottom: 6 }}>
          전화번호
        </p>

        <input
          value={phone}
          onChange={(e) => {
            console.log("📞 전화번호 입력:", e.target.value);
            setPhone(e.target.value);
          }}
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
          onClick={() => {

            console.log("🟣 버튼 눌림");
            console.log("isValid:", isValid);

            handleVerify();

          }}
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