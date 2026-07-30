import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

/* ===============================
   ⏱ 시간 포맷
=============================== */

function formatTime(ts) {

  if (!ts) return "";

  try {

    const date = ts.toDate();
    const now = new Date();

    const diff = now.getTime() - date.getTime();

    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;

    if (diff < min) return "방금 전";
    if (diff < hour) return `${Math.floor(diff / min)}분 전`;
    if (diff < day) return `${Math.floor(diff / hour)}시간 전`;

    return `${date.getMonth()+1}/${date.getDate()}`;

  } catch {
    return "";
  }

}

export default function ChatList() {

  const navigate = useNavigate();

  const [rooms,setRooms] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    let unsubRooms;

    const unsubAuth = auth.onAuthStateChanged((user)=>{

      if(!user){
        setRooms([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db,"chat_rooms"),
        where("clientId","==",user.uid),
        orderBy("lastMessageAt","desc")
      );

      unsubRooms = onSnapshot(q,(snap)=>{

        const list = snap.docs.map(d=>({
          id:d.id,
          ...d.data()
        }));

        setRooms(list);
        setLoading(false);

      });

    });

    return ()=>{
      unsubAuth();
      if(unsubRooms) unsubRooms();
    };

  },[]);

  /* 새 상담 */

  const createNewChat = async()=>{

    const user = auth.currentUser;
    if(!user) return;

    try{

      await addDoc(collection(db,"chat_rooms"),{

        clientId:user.uid,
        lawyerId:null,

        status:"waiting",

        createdAt:serverTimestamp(),

        lastMessage:null,
        lastMessageAt:serverTimestamp(),

        unreadCount:0

      });

      navigate("/consult/general");

    }catch(err){

      console.log("채팅방 생성 오류",err);

    }

  };

  /* 상태 */

  const renderStatus = (item)=>{

    let label = "대기중";
    let bg = "#FEF3C7";
    let color = "#92400E";

    if(item.status==="closed"){

      label="종료";
      bg="#F3F4F6";
      color="#6B7280";

    }
    else if(item.counselorId){

      label="진행중";
      bg="#DCFCE7";
      color="#166534";

    }

    return (

      <div
        style={{
          background:bg,
          padding:"4px 10px",
          borderRadius:12,
          fontSize:11,
          fontWeight:700,
          color:color,
          display:"inline-block"
        }}
      >
        {label}
      </div>

    );

  };

  if(loading){

    return (

      <div
        style={{
          height:"100vh",
          display:"flex",
          alignItems:"center",
          justifyContent:"center"
        }}
      >
        loading...
      </div>

    );

  }

  if(!rooms.length){

    return (

      <div
        style={{
          height:"100vh",
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          justifyContent:"center"
        }}
      >

        <h2>아직 상담이 없습니다</h2>
        <p style={{color:"#6B7280"}}>
          새 상담을 시작해보세요
        </p>

      </div>

    );

  }

  return (

    <div
      style={{
        maxWidth:720,
        margin:"0 auto",
        background:"#F9FAFB",
        minHeight:"100vh"
      }}
    >

      <div style={{padding:"24px 20px"}}>

        <h1
          style={{
            fontSize:26,
            fontWeight:700
          }}
        >
          내 상담
        </h1>

      </div>

      {rooms.map(item=>{

        const myUid = auth.currentUser?.uid;
        const unread = item?.unread?.[myUid] ?? 0;

        return (

          <div
            key={item.id}
            onClick={()=>{
              if(item.status!=="closed"){
                navigate(`/chat/${item.id}`);
              }
            }}
            style={{
              padding:"18px 20px",
              background:item.status==="closed"?"#F3F4F6":"white",
              borderBottom:"1px solid #F3F4F6",
              cursor:item.status==="closed"?"default":"pointer",
              opacity:item.status==="closed"?0.6:1
            }}
          >

            {/* 1줄 */}

            <div
              style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
              }}
            >

              <div
                style={{
                  fontWeight:700,
                  fontSize:15
                }}
              >
                상담방
              </div>

              <div
                style={{
                  fontSize:12,
                  color:"#9CA3AF"
                }}
              >
                {formatTime(item.lastMessageAt)}
              </div>

            </div>

            {/* 메시지 */}

            <div
              style={{
                marginTop:6,
                color:"#6B7280",
                fontSize:14
              }}
            >
              {item.lastMessage ?? "메시지가 없습니다"}
            </div>

            {/* 상태 */}

            <div style={{marginTop:8}}>
              {renderStatus(item)}
            </div>

            {/* unread */}

            {unread>0 && (

              <div
                style={{
                  marginTop:8,
                  background:"#EF4444",
                  color:"white",
                  fontSize:11,
                  fontWeight:700,
                  display:"inline-block",
                  padding:"3px 8px",
                  borderRadius:10
                }}
              >
                {unread>99?"99+":unread}
              </div>

            )}

          </div>

        );

      })}

      {/* floating button */}

      <button
        onClick={createNewChat}
        style={{
          position:"fixed",
          bottom:100,
          right:30,
          background:"#5B6BE8",
          color:"white",
          border:"none",
          borderRadius:30,
          padding:"16px 24px",
          fontWeight:800,
          cursor:"pointer",
          boxShadow:"0 6px 16px rgba(0,0,0,0.15)"
        }}
      >
        + 새 상담 시작
      </button>

    </div>

  );

}
