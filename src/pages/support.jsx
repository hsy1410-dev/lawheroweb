import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";

export default function Support() {

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tickets, setTickets] = useState([]);

  const user = auth.currentUser;

  /* 내 문의 불러오기 */

  useEffect(() => {

    if (!user) return;

    const q = query(
      collection(db, "support_requests"),
      where("uid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const list = [];

      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setTickets(list);

    });

    return unsubscribe;

  }, [user]);

  const handleSubmit = async () => {

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {

      await addDoc(collection(db, "support_requests"), {
        uid: user?.uid || null,
        email: user?.email || null,
        title: title.trim(),
        content: content.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("문의가 정상적으로 접수되었습니다.");

      setTitle("");
      setContent("");

    } catch (error) {

      console.log(error);
      alert("문의 접수 중 문제가 발생했습니다.");

    }

  };

  return (

    <div
      style={{
        maxWidth:720,
        margin:"0 auto",
        padding:20
      }}
    >

      <h1
        style={{
          fontSize:24,
          fontWeight:800,
          marginBottom:20
        }}
      >
        고객센터
      </h1>

      {/* 안내 카드 */}

      <div
        style={{
          background:"#F9FAFB",
          borderRadius:16,
          padding:20,
          border:"1px solid #E5E7EB",
          marginBottom:20
        }}
      >

        <div style={{fontWeight:700, marginBottom:6}}>
          문의하기
        </div>

        <div style={{fontSize:14, color:"#6B7280"}}>
          서비스 이용 중 문제가 발생했거나 문의사항이 있으면 남겨주세요.
        </div>

      </div>

      {/* 제목 */}

      <input
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        style={{
          width:"100%",
          padding:14,
          borderRadius:10,
          border:"1px solid #E5E7EB",
          marginBottom:14,
          fontSize:14
        }}
      />

      {/* 내용 */}

      <textarea
        placeholder="문의 내용을 입력하세요"
        value={content}
        onChange={(e)=>setContent(e.target.value)}
        style={{
          width:"100%",
          height:160,
          padding:14,
          borderRadius:10,
          border:"1px solid #E5E7EB",
          resize:"none",
          fontSize:14
        }}
      />

      {/* 버튼 */}

      <button
        onClick={handleSubmit}
        style={{
          width:"100%",
          marginTop:16,
          background:"#4F46E5",
          color:"white",
          border:"none",
          borderRadius:10,
          padding:14,
          fontWeight:700,
          cursor:"pointer"
        }}
      >
        문의 제출
      </button>

      {/* 내 문의 */}

      <div style={{marginTop:40}}>

        <h2
          style={{
            fontSize:20,
            fontWeight:700,
            marginBottom:16
          }}
        >
          내 문의
        </h2>

        {tickets.map((ticket)=>(

          <div
            key={ticket.id}
            style={{
              border:"1px solid #E5E7EB",
              borderRadius:12,
              padding:16,
              marginBottom:14,
              background:"#fff"
            }}
          >

            <div style={{fontWeight:700, marginBottom:6}}>
              {ticket.title}
            </div>

            <div style={{color:"#6B7280", marginBottom:10}}>
              {ticket.content}
            </div>

            <div style={{fontSize:13, marginBottom:10}}>
              상태 :
              {ticket.status === "pending"
                ? " ⏳ 답변 대기중"
                : " ✅ 답변 완료"}
            </div>

            {/* 관리자 답변 */}

            {ticket.answer && (

              <div
                style={{
                  background:"#F3F4F6",
                  padding:12,
                  borderRadius:8
                }}
              >

                <div
                  style={{
                    fontWeight:700,
                    marginBottom:4
                  }}
                >
                  관리자 답변
                </div>

                <div style={{color:"#374151"}}>
                  {ticket.answer}
                </div>

              </div>

            )}

          </div>

        ))}

      </div>

    </div>

  );

}