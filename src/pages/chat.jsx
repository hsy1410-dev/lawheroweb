import { useParams, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  IoArrowBack,
  IoArrowUp,
  IoStar,
  IoStarOutline,
  IoChatbubbleEllipsesOutline,
  IoLockClosedOutline,
} from "react-icons/io5";

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const myUid = auth.currentUser?.uid;

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const prevStatusRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const messageScrollRef = useRef(null);

  /* =========================
     채팅방 정보
  ========================= */
  useEffect(() => {
    if (!id || !myUid) return;

    const unsubscribe = onSnapshot(doc(db, "chat_rooms", id), async (snap) => {
      if (!snap.exists()) return;

      const data = { id: snap.id, ...snap.data() };
      setRoom(data);

      const currentStatus = data.status;
      const prevStatus = prevStatusRef.current;

      if (
        prevStatus &&
        prevStatus !== "closed" &&
        currentStatus === "closed"
      ) {
        const reviewSnap = await getDoc(doc(db, "reviews", id));
        const isClient = data.clientId === myUid;

        if (!reviewSnap.exists() && isClient) {
          setReviewOpen(true);
        }
      }

      prevStatusRef.current = currentStatus;
    });

    return unsubscribe;
  }, [id, myUid]);

  /* =========================
     메시지 실시간
  ========================= */
  useEffect(() => {
    if (!id || !myUid) return;

    const q = query(
      collection(db, "chat_rooms", id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const raw = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const unreadMessages = raw.filter(
        (msg) => msg.uid !== myUid && !msg.read
      );

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map((msg) =>
            updateDoc(doc(db, "chat_rooms", id, "messages", msg.id), {
              read: true,
            })
          )
        );

        await updateDoc(doc(db, "chat_rooms", id), {
          [`unread.${myUid}`]: 0,
        });
      }

      setMessages(raw);
    });

    return unsubscribe;
  }, [id, myUid]);

  /* =========================
     메시지 변경 시 자동 스크롤
  ========================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages]);

  /* =========================
     textarea 높이 자동 조절
  ========================= */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  /* =========================
     메시지 전송
  ========================= */
  const sendMessage = async () => {
    if (!text.trim() || !room || room.status === "closed") return;

    const messageText = text.trim();
    setText("");

    const roomRef = doc(db, "chat_rooms", id);

    const otherUid =
      myUid === room.clientId ? room.counselorId : room.clientId;

    if (otherUid && room.status === "assigned") {
      await updateDoc(roomRef, {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
        lastSender: myUid,
        [`unread.${otherUid}`]: increment(1),
      });
    }

    await addDoc(collection(db, "chat_rooms", id, "messages"), {
      text: messageText,
      uid: myUid,
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  /* =========================
     리뷰 제출
  ========================= */
  const submitReview = async () => {
    if (!room) return;

    await setDoc(doc(db, "reviews", id), {
      roomId: id,
      clientId: room.clientId,
      counselorId: room.counselorId,
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    });

    setReviewOpen(false);
    navigate("/");
  };

  /* =========================
     시간 표시 포맷
  ========================= */
  const formatTime = (timestamp) => {
    return (
      timestamp?.toDate?.().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }) || ""
    );
  };

  if (!room) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#F9FAFB",
          color: "#6B7280",
          fontSize: 15,
        }}
      >
        채팅방 로딩중...
      </div>
    );
  }

  const isClosed = room.status === "closed";
  const canSend = text.trim().length > 0 && !isClosed;

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F3F4F6",
      }}
    >
      {/* header */}
      <div
        style={{
          height: 64,
          minHeight: 64,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #E5E7EB",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "none",
            background: "#F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <IoArrowBack size={20} color="#111827" />
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            상담방
          </div>

          <div
            style={{
              fontSize: 12,
              color: isClosed ? "#EF4444" : "#6B7280",
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {isClosed ? "상담이 종료되었어요" : "실시간 상담 채팅"}
          </div>
        </div>

        <div style={{ width: 36 }} />
      </div>

      {/* 종료 안내 배너 */}
      {isClosed && (
        <div
          style={{
            padding: "10px 16px",
            background: "#FEF2F2",
            borderBottom: "1px solid #FECACA",
            color: "#B91C1C",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IoLockClosedOutline size={16} />
          상담이 종료되어 더 이상 메시지를 보낼 수 없어요.
        </div>
      )}

      {/* messages */}
      <div
        ref={messageScrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px 16px 12px",
          boxSizing: "border-box",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#9CA3AF",
              fontSize: 14,
              flexDirection: "column",
              gap: 10,
            }}
          >
            <IoChatbubbleEllipsesOutline size={34} color="#D1D5DB" />
            아직 메시지가 없어요.
          </div>
        ) : (
          messages.map((msg, index) => {
            const mine = msg.uid === myUid;
            const time = formatTime(msg.createdAt);

            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];

            const isSameSenderAsPrev = prevMsg?.uid === msg.uid;
            const isSameSenderAsNext = nextMsg?.uid === msg.uid;

            const showTime = !isSameSenderAsNext;
            const showTopSpacing = !isSameSenderAsPrev;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: mine ? "flex-end" : "flex-start",
                  marginTop: showTopSpacing ? 14 : 6,
                }}
              >
                <div
                  style={{
                    maxWidth: "76%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: mine ? "flex-end" : "flex-start",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      background: mine ? "#4F46E5" : "#FFFFFF",
                      color: mine ? "#FFFFFF" : "#111827",
                      padding: "11px 14px",
                      borderRadius: mine
                        ? "18px 18px 6px 18px"
                        : "18px 18px 18px 6px",
                      boxShadow: mine
                        ? "0 4px 10px rgba(79,70,229,0.18)"
                        : "0 2px 8px rgba(0,0,0,0.06)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: 14,
                      lineHeight: "20px",
                    }}
                  >
                    {msg.text}
                  </div>

                  {showTime && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        padding: "0 4px",
                      }}
                    >
                      {time}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div
        style={{
          padding: "10px 12px 14px",
          background: "#F3F4F6",
          borderTop: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "8px 8px 8px 14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            border: "1px solid #E5E7EB",
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            disabled={isClosed}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              isClosed
                ? "상담이 종료되어 입력할 수 없어요"
                : "무엇이든 물어보세요"
            }
            rows={1}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              background: "transparent",
              fontSize: 14,
              lineHeight: "20px",
              color: isClosed ? "#9CA3AF" : "#111827",
              minHeight: 20,
              maxHeight: 120,
              fontFamily: "inherit",
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!canSend}
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: 20,
              border: "none",
              background: canSend ? "#111827" : "#D1D5DB",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: canSend ? "pointer" : "not-allowed",
              transition: "0.2s ease",
            }}
          >
            <IoArrowUp size={18} />
          </button>
        </div>
      </div>

      {/* 리뷰 팝업 */}
      {reviewOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 8,
              }}
            >
              상담은 어떠셨나요?
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 18,
                lineHeight: "20px",
              }}
            >
              상담이 종료되었어요. 만족도를 남겨주시면 서비스 개선에 큰 도움이 돼요.
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 18,
              }}
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    transform: num === rating ? "scale(1.08)" : "scale(1)",
                    transition: "0.15s ease",
                  }}
                >
                  {num <= rating ? (
                    <IoStar size={30} color="#FACC15" />
                  ) : (
                    <IoStarOutline size={30} color="#FACC15" />
                  )}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="후기를 남겨주세요 (선택)"
              style={{
                width: "100%",
                minHeight: 100,
                borderRadius: 14,
                border: "1px solid #E5E7EB",
                padding: 14,
                boxSizing: "border-box",
                resize: "none",
                outline: "none",
                fontSize: 14,
                lineHeight: "20px",
                fontFamily: "inherit",
                marginBottom: 16,
                background: "#F9FAFB",
              }}
            />

            <button
              onClick={submitReview}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "#111827",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              리뷰 등록하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
