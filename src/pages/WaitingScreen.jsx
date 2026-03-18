import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function WaitingScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestId = searchParams.get("requestId");
  const [status, setStatus] = useState("waiting");

  useEffect(() => {
    if (!requestId) return;

    const requestRef = doc(db, "consult_requests", requestId);

    const unsub = onSnapshot(requestRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setStatus(data.status);

      /* 상담사 배정 */
      if (data.status === "assigned" && data.roomId) {
        console.log("상담사 배정 완료");
        navigate(`/chat/${data.roomId}`);
        return;
      }

      /* 취소 */
      if (data.status === "cancelled") {
        navigate("/home");
      }
    });

    return () => unsub();
  }, [requestId, navigate]);

  const getMessage = () => {
    if (status === "waiting") {
      return "관리자가 상황에 맞는 상담사를 배정하고 있습니다.";
    }

    if (status === "assigned") {
      return "상담사가 배정되었습니다. 채팅방으로 이동 중입니다.";
    }

    if (status === "cancelled") {
      return "상담 요청이 취소되었습니다.";
    }

    return "처리 중입니다.";
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
      {/* spinner */}
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
          width: "100%",
          maxWidth: 420,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          상담 요청이 접수되었습니다
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#6B7280",
            lineHeight: 20,
          }}
        >
          {getMessage()}
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
