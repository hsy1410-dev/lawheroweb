import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

import {
  IoArrowBack,
  IoArrowUp,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";

import { auth, db } from "../firebase/firebase";

const BOT_UID = "lawhero_quick_bot";
const BOT_NAME = "LawHero";
const GREETING_MESSAGE =
  "안녕하세요~ 궁금하신 내용을 남겨주시면 신속하게 답변드리겠습니다.";
const BOT_REPLY_MESSAGE =
  "남겨주신 내용을 확인했어요. 상담사를 호출하면 바로 이어서 도와드릴게요.";

export default function QuickStart() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      id: "quick-bot-greeting",
      senderType: "bot",
      uid: BOT_UID,
      text: GREETING_MESSAGE,
      createdAt: new Date(),
    },
  ]);
  const [text, setText] = useState("");
  const [hasUserMessage, setHasUserMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const getTrafficInfo = () => {
    const ua = navigator.userAgent || "";
    const referrer = document.referrer || "";

    const isNaverBrowser = /naver|whale/i.test(ua);
    const isNaverReferrer = /naver\.com/i.test(referrer);
    const isFromNaver = isNaverBrowser || isNaverReferrer;
    const source = isFromNaver ? "naver" : "default";
    const adminTarget = isFromNaver ? "special" : "general";

    return {
      ua,
      referrer,
      isNaverBrowser,
      isNaverReferrer,
      isFromNaver,
      source,
      adminTarget,
    };
  };

  const sendLocalMessage = () => {
    const user = auth.currentUser;

    if (!user) {
      navigate("/auth");
      return;
    }

    const messageText = text.trim();
    if (!messageText || loading) return;

    setText("");

    const now = Date.now();
    const nextMessages = [
      ...messages,
      {
        id: `quick-user-${now}`,
        senderType: "user",
        uid: user.uid,
        text: messageText,
        createdAt: new Date(now),
      },
    ];

    if (!hasUserMessage) {
      nextMessages.push({
        id: `quick-bot-reply-${now}`,
        senderType: "bot",
        uid: BOT_UID,
        text: BOT_REPLY_MESSAGE,
        createdAt: new Date(now + 1000),
      });
    }

    setMessages(nextMessages);
    setHasUserMessage(true);
  };

  const callCounselor = async () => {
    const user = auth.currentUser;

    if (!user) {
      navigate("/auth");
      return;
    }

    if (!hasUserMessage || loading) return;

    setLoading(true);

    try {
      const {
        ua,
        referrer,
        isNaverBrowser,
        isNaverReferrer,
        isFromNaver,
        source,
        adminTarget,
      } = getTrafficInfo();

      const submittedAt = Date.now();
      const pendingText = text.trim();
      const submittedMessages = pendingText
        ? [
            ...messages,
            {
              id: `quick-user-${submittedAt}`,
              senderType: "user",
              uid: user.uid,
              text: pendingText,
              createdAt: new Date(submittedAt),
            },
          ]
        : messages;

      if (pendingText) {
        setText("");
        setMessages(submittedMessages);
      }

      const requestRef = doc(collection(db, "consult_requests"));
      const roomRef = doc(collection(db, "chat_rooms"));
      const batch = writeBatch(db);

      const userMessages = submittedMessages.filter(
        (message) => message.senderType === "user"
      );
      const content = userMessages.map((message) => message.text).join("\n\n");
      const lastUserMessage =
        userMessages[userMessages.length - 1]?.text ||
        "빠른 상담 요청이 접수되었습니다.";
      const chatPreview = submittedMessages.map((message) => ({
        senderType: message.senderType,
        text: message.text,
      }));

      batch.set(requestRef, {
        userId: user.uid,
        category: "quick",
        subCategory: "빠른 상담",
        content,
        status: "waiting",
        counselorId: null,
        roomId: roomRef.id,
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
        conversationMode: "quick_bot",
        chatPreview,
      });

      batch.set(roomRef, {
        clientId: user.uid,
        counselorId: null,
        requestId: requestRef.id,
        status: "waiting",
        category: "quick",
        subCategory: "빠른 상담",
        content,
        users: [user.uid],
        lastMessage: lastUserMessage,
        lastMessageAt: serverTimestamp(),
        lastSender: user.uid,
        unread: {
          [user.uid]: 0,
        },
        unreadCount: 0,
        createdAt: serverTimestamp(),

        source,
        conversationMode: "quick_bot",
      });

      const persistedAt = Date.now();

      submittedMessages.forEach((message, index) => {
        const messageRef = doc(
          collection(db, "chat_rooms", roomRef.id, "messages")
        );

        batch.set(messageRef, {
          text: message.text,
          uid: message.senderType === "bot" ? BOT_UID : user.uid,
          senderType: message.senderType,
          senderName: message.senderType === "bot" ? BOT_NAME : null,
          read: true,
          createdAt: Timestamp.fromDate(
            new Date(persistedAt + index * 1000)
          ),
        });
      });

      await batch.commit();

      const res = await fetch("/api/sendPush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "consult",
          message: "새 빠른 상담 요청이 접수되었습니다.",
          consultId: requestRef.id,
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

      navigate(`/waiting?requestId=${requestRef.id}`);
    } catch (err) {
      console.log("빠른 상담 오류:", err);
      alert("상담 요청 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (value) => {
    const date = value?.toDate?.() ? value.toDate() : value;

    return (
      date?.toLocaleTimeString?.("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }) || ""
    );
  };

  const canSend = text.trim().length > 0 && !loading;

  return (
    <div className="quick-chat-screen">
      <div className="quick-chat-header">
        <button
          className="quick-icon-button"
          onClick={() => navigate(-1)}
          type="button"
        >
          <IoArrowBack size={20} color="#111827" />
        </button>

        <div className="quick-header-copy">
          <div className="quick-header-title">빠른 상담</div>
          <div className="quick-header-status">
            {loading ? "상담사 호출 중" : "로비 상담봇"}
          </div>
        </div>

        <div className="quick-header-spacer" />
      </div>

      <div className="quick-chat-messages">
        {messages.map((message, index) => {
          const mine = message.senderType === "user";
          const prevMessage = messages[index - 1];
          const nextMessage = messages[index + 1];
          const isSameSenderAsPrev =
            prevMessage?.senderType === message.senderType;
          const isSameSenderAsNext =
            nextMessage?.senderType === message.senderType;
          const showTime = !isSameSenderAsNext;

          return (
            <div
              key={message.id}
              className={`quick-message-row ${mine ? "mine" : "bot"}`}
              style={{
                marginTop: isSameSenderAsPrev ? 6 : 14,
              }}
            >
              {!mine && (
                <div className="quick-bot-avatar">
                  <IoChatbubbleEllipsesOutline size={18} color="#4F46E5" />
                </div>
              )}

              <div
                className={`quick-message-stack ${mine ? "mine" : "bot"}`}
              >
                <div className={`quick-message-bubble ${mine ? "mine" : ""}`}>
                  {message.text}
                </div>

                {showTime && (
                  <div className="quick-message-time">
                    {formatTime(message.createdAt)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="quick-chat-footer">
        {hasUserMessage && (
          <button
            className="quick-call-button"
            onClick={callCounselor}
            disabled={loading}
            type="button"
          >
            {loading ? "호출 중..." : "상담사 호출하기"}
          </button>
        )}

        <div className="quick-input-shell">
          <textarea
            ref={textareaRef}
            value={text}
            disabled={loading}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendLocalMessage();
              }
            }}
            placeholder="궁금한 내용을 입력해주세요"
            rows={1}
            className="quick-chat-textarea"
          />

          <button
            className="quick-send-button"
            onClick={sendLocalMessage}
            disabled={!canSend}
            type="button"
          >
            <IoArrowUp size={18} />
          </button>
        </div>
      </div>

      <style>
        {`
          .quick-chat-screen {
            max-width: 720px;
            height: 100dvh;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            background: #F3F4F6;
            color: #111827;
            box-sizing: border-box;
          }

          .quick-chat-header {
            height: 64px;
            min-height: 64px;
            background: rgba(255,255,255,0.96);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            border-bottom: 1px solid #E5E7EB;
            box-sizing: border-box;
          }

          .quick-icon-button,
          .quick-send-button {
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: 0.2s ease;
          }

          .quick-icon-button {
            width: 36px;
            height: 36px;
            border-radius: 999px;
            background: #F3F4F6;
          }

          .quick-header-copy {
            text-align: center;
          }

          .quick-header-title {
            font-size: 15px;
            font-weight: 800;
          }

          .quick-header-status {
            margin-top: 2px;
            font-size: 12px;
            color: #6B7280;
            font-weight: 600;
          }

          .quick-header-spacer {
            width: 36px;
          }

          .quick-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 18px 16px 12px;
            box-sizing: border-box;
          }

          .quick-message-row {
            display: flex;
            align-items: flex-end;
            gap: 8px;
          }

          .quick-message-row.mine {
            justify-content: flex-end;
          }

          .quick-message-row.bot {
            justify-content: flex-start;
          }

          .quick-bot-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #EEF2FF;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 32px;
          }

          .quick-message-stack {
            max-width: 76%;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .quick-message-stack.mine {
            align-items: flex-end;
          }

          .quick-message-stack.bot {
            align-items: flex-start;
          }

          .quick-message-bubble {
            background: #FFFFFF;
            color: #111827;
            padding: 11px 14px;
            border-radius: 18px 18px 18px 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 14px;
            line-height: 20px;
          }

          .quick-message-bubble.mine {
            background: #4F46E5;
            color: #FFFFFF;
            border-radius: 18px 18px 6px 18px;
            box-shadow: 0 4px 10px rgba(79,70,229,0.18);
          }

          .quick-message-time {
            font-size: 11px;
            color: #9CA3AF;
            padding: 0 4px;
          }

          .quick-chat-footer {
            padding: 10px 12px calc(14px + env(safe-area-inset-bottom));
            background: #F3F4F6;
            border-top: 1px solid #E5E7EB;
            box-sizing: border-box;
          }

          .quick-call-button {
            width: 100%;
            min-height: 48px;
            margin-bottom: 10px;
            border: none;
            border-radius: 14px;
            background: #111827;
            color: #FFFFFF;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
          }

          .quick-call-button:disabled {
            background: #9CA3AF;
            cursor: not-allowed;
          }

          .quick-input-shell {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            background: #FFFFFF;
            border-radius: 24px;
            padding: 8px 8px 8px 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            border: 1px solid #E5E7EB;
          }

          .quick-chat-textarea {
            flex: 1;
            min-height: 20px;
            max-height: 120px;
            border: none;
            outline: none;
            resize: none;
            background: transparent;
            color: #111827;
            font-family: inherit;
            font-size: 14px;
            line-height: 20px;
          }

          .quick-chat-textarea:disabled {
            color: #9CA3AF;
          }

          .quick-send-button {
            width: 40px;
            height: 40px;
            min-width: 40px;
            border-radius: 20px;
            background: #111827;
            color: #FFFFFF;
          }

          .quick-send-button:disabled {
            background: #D1D5DB;
            cursor: not-allowed;
          }

          @media (max-width: 480px) {
            .quick-chat-header {
              height: 58px;
              min-height: 58px;
              padding: 0 12px;
            }

            .quick-chat-messages {
              padding: 16px 12px 10px;
            }

            .quick-message-stack {
              max-width: 78%;
            }

            .quick-chat-footer {
              padding: 8px 10px calc(12px + env(safe-area-inset-bottom));
            }
          }
        `}
      </style>
    </div>
  );
}
