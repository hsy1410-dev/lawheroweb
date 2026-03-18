import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

export default function QuickStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startQuickChat();
  }, []);

  const startQuickChat = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigate("/auth");
        return;
      }

      console.log("🔥 빠른 상담 시작:", user.uid);

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
      console.log("isNaverBrowser:", isNaverBrowser);
      console.log("isNaverReferrer:", isNaverReferrer);
      console.log("isFromNaver:", isFromNaver);
      console.log("source:", source);

      /* ==============================
      1️⃣ consult_requests 생성
      ============================== */
      let requestId;

      try {
        const requestRef = await addDoc(
          collection(db, "consult_requests"),
          {
            userId: user.uid,
            category: "quick",
            subCategory: "빠른 상담",
            status: "waiting",
            createdAt: serverTimestamp(),

            // 유입 정보
            source,
            userAgent: ua,
            referrer,
            isNaverBrowser,
            isNaverReferrer,
            isFromNaver,
             needsManualAssignment: true,
  assignmentType: "manual"
          }
        );

        requestId = requestRef.id;

        console.log("consult 생성:", requestId);
      } catch (e) {
        console.log("consult 오류:", e);
        return;
      }

      /* ==============================
      2️⃣ chat_room 생성
      ============================== */
      const roomRef = await addDoc(
        collection(db, "chat_rooms"),
        {
          clientId: user.uid,
          counselorId: null,
          requestId,
          status: "waiting",
          users: [user.uid],
          lastMessage: "",
          lastMessageAt: null,
          unreadCount: 0,
          createdAt: serverTimestamp(),

          // 참고용
          source,
        }
      );

      const roomId = roomRef.id;

      console.log("chat_room 생성:", roomId);

      /* ==============================
      3️⃣ consult_requests 연결
      ============================== */
      await updateDoc(
        doc(db, "consult_requests", requestId),
        { roomId }
      );

      /* ==============================
      4️⃣ 관리자 푸시
      ============================== */
      const res = await fetch(
        "https://lawhero-web.vercel.app/api/sendPush",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "consult",
            message:
              source === "naver"
                ? "네이버 유입 빠른 상담 요청이 접수되었습니다."
                : "새 빠른 상담 요청이 접수되었습니다.",
            consultId: requestId,
            source,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.log("푸시 오류:", err);
      } else {
        const data = await res.json();
        console.log("푸시 성공:", data);
      }

      /* ==============================
      5️⃣ waiting 이동
      ============================== */
      navigate(`/waiting?requestId=${requestId}`);
    } catch (err) {
      console.log("빠른 상담 오류:", err);
      alert("상담 요청 중 문제가 발생했습니다.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "0 30px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "4px solid #E5E7EB",
          borderTop: "4px solid #4F46E5",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />

      <div
        style={{
          marginTop: 30,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          빠른 상담 요청 중입니다
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#6B7280",
            lineHeight: 20,
          }}
        >
          요청을 처리하고 있습니다.
          <br />
          잠시만 기다려주세요.
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
