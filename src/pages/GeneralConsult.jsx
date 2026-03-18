import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

import lawheroLogo from "../assets/lawhero.png";

export default function GeneralConsult() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialCategory = params.get("category");

  const [category, setCategory] = useState(initialCategory ?? null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    { key: "형사", label: "형사" },
    { key: "민사", label: "민사" },
    { key: "도산/개인회생", label: "도산/개인회생" },
    { key: "이혼", label: "이혼" },
    { key: "부동산", label: "부동산" }
  ];

  const submitConsult = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    if (!category) {
      alert("상담 분야를 선택해주세요");
      return;
    }

    setLoading(true);

    try {
      /* ==============================
      0️⃣ 네이버 유입 판별
      ============================== */
      const ua = navigator.userAgent || "";
      const referrer = document.referrer || "";

      const isNaverBrowser = /naver|whale/i.test(ua);
      const isNaverReferrer = /naver\.com/i.test(referrer);
      const isFromNaver = isNaverBrowser || isNaverReferrer;
      const source = isFromNaver ? "naver" : "default";

      console.log("UA:", ua);
      console.log("REF:", referrer);
      console.log("source:", source);

      /* ==============================
      1️⃣ 상담사 조회
      ============================== */
      const counselorQuery = query(
        collection(db, "users"),
        where("role", "==", "counselor"),
        where("specialties", "array-contains", category),
        where("isAvailable", "==", true)
      );

      const snap = await getDocs(counselorQuery);

      let assignedCounselorId = null;

      if (!snap.empty) {
        const counselors = snap.docs;
        const randomIndex = Math.floor(Math.random() * counselors.length);
        assignedCounselorId = counselors[randomIndex].id;
      }

      /* ==============================
      2️⃣ consult_requests 생성
      ============================== */
      const requestRef = await addDoc(collection(db, "consult_requests"), {
        userId: user.uid,
        category: "general",
        subCategory: category,
        content: content || "",
        status: assignedCounselorId ? "assigned" : "waiting",
        counselorId: assignedCounselorId,
        createdAt: serverTimestamp(),

        // 유입 정보
        source,
        userAgent: ua,
        referrer,
        isNaverBrowser,
        isNaverReferrer,
        isFromNaver
      });

      const requestId = requestRef.id;

      console.log("consult_requests 생성:", requestId);

      /* ==============================
      3️⃣ chat_room 생성
      ============================== */
      const roomRef = await addDoc(collection(db, "chat_rooms"), {
        clientId: user.uid,
        counselorId: assignedCounselorId,
        requestId,
        status: assignedCounselorId ? "assigned" : "waiting",
        category,
        createdAt: serverTimestamp(),
        lastMessage: content || "상담 요청이 접수되었습니다.",
        lastMessageAt: serverTimestamp(),
        unread: {
          [user.uid]: 0,
          ...(assignedCounselorId ? { [assignedCounselorId]: 1 } : {})
        },

        // 참고용
        source
      });

      const roomId = roomRef.id;

      console.log("chat_room 생성:", roomId);

      /* ==============================
      4️⃣ consult_requests에 roomId 연결
      ============================== */
      await updateDoc(doc(db, "consult_requests", requestId), {
        roomId
      });

      /* ==============================
      5️⃣ 채팅방 이동
      ============================== */
      navigate(`/chat/${roomId}`);
    } catch (err) {
      console.log(err);
      alert("상담 신청 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "20px",
        minHeight: "100vh",
        background: "#F9FAFB"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 20,
            cursor: "pointer"
          }}
        >
          ←
        </button>

        <img
          src={lawheroLogo}
          style={{ width: 60 }}
        />

        <div style={{ width: 24 }} />
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 30
        }}
      >
        <h2 style={{ marginBottom: 6 }}>법률 고민</h2>
        <h2>로비가 도와드릴게요!</h2>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 14,
          borderRadius: 20,
          marginTop: 20
        }}
      >
        어떤 법률 분야의 도움이 필요하신가요?
      </div>

      <div
        style={{
          background: "#EEF2FF",
          padding: 14,
          borderRadius: 16,
          marginTop: 14,
          fontSize: 13,
          color: "#4338CA"
        }}
      >
        상담 요청 후 앱을 종료하셔도 상담사 배정은 자동으로 진행됩니다.
      </div>

      <div
        style={{
          background: "#F9FAFB",
          padding: 14,
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          marginTop: 14,
          fontSize: 13
        }}
      >
        상담 가능 시간: 평일 오전 10시 - 오후 7시
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          marginTop: 20
        }}
      >
        {categories.map((item) => {
          const active = category === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setCategory(item.key)}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                marginRight: 10,
                marginBottom: 10,
                cursor: "pointer",
                fontWeight: 600,
                background: active ? "#5B6BE8" : "#fff",
                color: active ? "white" : "#111827"
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <textarea
        placeholder="상담 내용을 간단히 적어주세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          minHeight: 120,
          marginTop: 20,
          borderRadius: 16,
          padding: 16,
          border: "1px solid #E5E7EB",
          resize: "none"
        }}
      />

      <button
        onClick={submitConsult}
        disabled={loading}
        style={{
          width: "100%",
          padding: 16,
          marginTop: 30,
          borderRadius: 20,
          border: "none",
          fontWeight: 700,
          cursor: "pointer",
          background: loading ? "#9CA3AF" : "#5B6BE8",
          color: "white"
        }}
      >
        {loading ? "연결 중..." : "상담 신청하기"}
      </button>
    </div>
  );
}
