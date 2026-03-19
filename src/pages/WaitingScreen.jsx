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

      if (data.status === "assigned" && data.roomId) {
        console.log("상담사 배정 완료");
        navigate(`/chat/${data.roomId}`);
        return;
      }

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
    <>
      <div className="waiting-screen">
        <div className="waiting-inner">
          <div className="spinner" />

          <div className="waiting-card">
            <div className="waiting-title">상담 요청이 접수되었습니다</div>
            <div className="waiting-desc">{getMessage()}</div>
          </div>
        </div>
      </div>

      <style>
        {`
          .waiting-screen {
            min-height: 100dvh;
            background: #F9FAFB;
            padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }

          .waiting-inner {
            width: 100%;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .spinner {
            width: 44px;
            height: 44px;
            border: 4px solid #E5E7EB;
            border-top: 4px solid #4F46E5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            flex-shrink: 0;
          }

          .waiting-card {
            margin-top: 24px;
            width: 100%;
            background: #FFFFFF;
            border-radius: 20px;
            padding: 24px 18px;
            text-align: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.08);
            box-sizing: border-box;
          }

          .waiting-title {
            font-size: 18px;
            font-weight: 700;
            line-height: 1.4;
            margin-bottom: 10px;
            word-break: keep-all;
          }

          .waiting-desc {
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
            .waiting-screen {
              padding: 20px 14px calc(20px + env(safe-area-inset-bottom));
              align-items: flex-start;
            }

            .waiting-inner {
              max-width: 100%;
              margin-top: 80px;
            }

            .spinner {
              width: 40px;
              height: 40px;
            }

            .waiting-card {
              margin-top: 20px;
              border-radius: 18px;
              padding: 22px 16px;
            }

            .waiting-title {
              font-size: 17px;
            }

            .waiting-desc {
              font-size: 13px;
              line-height: 1.55;
            }
          }
        `}
      </style>
    </>
  );
}
