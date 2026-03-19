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
      const adminTarget = isFromNaver ? "special" : "general";

      console.log("UA:", ua);
      console.log("REF:", referrer);
      console.log("isNaverBrowser:", isNaverBrowser);
      console.log("isNaverReferrer:", isNaverReferrer);
      console.log("isFromNaver:", isFromNaver);
      console.log("source:", source);
      console.log("adminTarget:", adminTarget);

      /* ==============================
      1️⃣ consult_requests 생성
      ============================== */
      let requestId;

      try {
        const requestRef = await addDoc(collection(db, "consult_requests"), {
          userId: user.uid,
          category: "quick",
          subCategory: "빠른 상담",
          status: "waiting",
          createdAt: serverTimestamp(),

          source,
          userAgent: ua,
          referrer,
          isNaverBrowser,
          isNaverReferrer,
          isFromNaver,

          needsManualAssignment: true,
          assignmentType: "manual",

          adminTarget,
        });

        requestId = requestRef.id;

        console.log("consult 생성:", requestId);
      } catch (e) {
        console.log("consult 오류:", e);
        return;
      }

      /* ==============================
      2️⃣ chat_room 생성
      ============================== */
      const roomRef = await addDoc(collection(db, "chat_rooms"), {
        clientId: user.uid,
        counselorId: null,
        requestId,
        status: "waiting",
        users: [user.uid],
        lastMessage: "",
        lastMessageAt: null,
        unreadCount: 0,
        createdAt: serverTimestamp(),

        source,
      });

      const roomId = roomRef.id;

      console.log("chat_room 생성:", roomId);

      /* ==============================
      3️⃣ consult_requests 연결
      ============================== */
      await updateDoc(doc(db, "consult_requests", requestId), {
        roomId,
      });

      /* ==============================
      4️⃣ 관리자 푸시
      ============================== */
      const res = await fetch("https://lawhero-web.vercel.app/api/sendPush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "consult",
          message:
            adminTarget === "special"
              ? "새 빠른 상담 요청이 접수되었습니다."
              : "새 빠른 상담 요청이 접수되었습니다.",
          consultId: requestId,
          adminTarget,
        }),
      });

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
  <>
    <div className="quick-wait-screen">
      <div className="quick-wait-inner">
        <div className="quick-spinner" />

        <div className="quick-wait-card">
          <div className="quick-wait-title">빠른 상담 요청 중입니다</div>

          <div className="quick-wait-desc">
            요청을 처리하고 있습니다.
            <br />
            잠시만 기다려주세요.
          </div>
        </div>
      </div>
    </div>

    <style>
      {`
        .quick-wait-screen {
          min-height: 100dvh;
          background: #F9FAFB;
          padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .quick-wait-inner {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .quick-spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #E5E7EB;
          border-top: 4px solid #4F46E5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }

        .quick-wait-card {
          margin-top: 24px;
          width: 100%;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px 18px;
          text-align: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
          box-sizing: border-box;
        }

        .quick-wait-title {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 10px;
          word-break: keep-all;
        }

        .quick-wait-desc {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.6;
          word-break: keep-all;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .quick-wait-screen {
            padding: 20px 14px calc(20px + env(safe-area-inset-bottom));
            align-items: flex-start;
          }

          .quick-wait-inner {
            max-width: 100%;
            margin-top: 80px;
          }

          .quick-spinner {
            width: 40px;
            height: 40px;
          }

          .quick-wait-card {
            margin-top: 20px;
            border-radius: 18px;
            padding: 22px 16px;
          }

          .quick-wait-title {
            font-size: 17px;
          }

          .quick-wait-desc {
            font-size: 13px;
            line-height: 1.55;
          }
        }
      `}
    </style>
  </>
);
}
