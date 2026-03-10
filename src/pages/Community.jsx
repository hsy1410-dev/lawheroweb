import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHelpCircle } from "react-icons/fi";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import field6 from "../assets/6.png";
import field7 from "../assets/7.png";
import field8 from "../assets/8.png";
import field9 from "../assets/9.png";
import field10 from "../assets/10.png";
import fieldAll from "../assets/11.png";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  IoBookmark,
  IoBookmarkOutline,
  IoHeart,
  IoChatbubbleOutline,
  IoFlame,
  IoPerson
} from "react-icons/io5";

import level1 from "../assets/1.png";
import level2 from "../assets/2.png";
import level3 from "../assets/3.png";
import level4 from "../assets/4.png";
import level5 from "../assets/5.png";

function getProfileImage(level) {
  switch (level) {
    case 1: return level1;
    case 2: return level2;
    case 3: return level3;
    case 4: return level4;
    case 5: return level5;
    default: return null;
  }
}

const MAIN_TABS = [
  { key: "experience", label: "경험" },
  { key: "expert", label: "전문가" },
  { key: "info", label: "정보" }
];
const EXPERT_FIELDS = [
  { key: "형사", label: "형사 분야", image: field6, color: "#6BAE8F" },
  { key: "민사", label: "민사 분야", image: field7, color: "#E6A04B" },
  { key: "도산/개인회생", label: "도산/개인회생", image: field8, color: "#6C7FD8" },
  { key: "이혼", label: "이혼", image: field9, color: "#E26B7A" },
  { key: "부동산", label: "부동산", image: field10, color: "#6BAED6" },
  { key: "all", label: "전체 분야", image: fieldAll, color: "#9CA3AF" },
];
export default function Community() {

  const navigate = useNavigate();
const nav = useNavigate(); 
  const [posts, setPosts] = useState([]);
  const [mainTab, setMainTab] = useState("experience");

  const [user, setUser] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
const [showInstallPopup, setShowInstallPopup] = useState(true);
  const [authorLevels, setAuthorLevels] = useState({});
const [selectedField, setSelectedField] = useState("all");
  /* 로그인 상태 */
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  /* 게시글 구독 */
  useEffect(() => {

    const base = collection(db, "community_posts");

   let q = query(
  base,
  where("category", "==", mainTab)
);

if (mainTab === "expert" && selectedField !== "all") {
  q = query(q, where("field", "==", selectedField));
}

q = query(
  q,
  orderBy("createdAt", "desc"),
  limit(50)
);

    const unsub = onSnapshot(q, (snap) => {

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setPosts(list);

    });

    return () => unsub();

  }, [mainTab, selectedField]);

  /* 작성자 레벨 구독 */
  useEffect(() => {

    if (posts.length === 0) return;

    const unsubscribers = posts
      .filter((p) => p.uid)
      .map((p) => {

        const ref = doc(db, "app_users", p.uid);

        return onSnapshot(ref, (snap) => {

          if (snap.exists()) {

            const level = snap.data().profileLevel ?? 0;

            setAuthorLevels((prev) => ({
              ...prev,
              [p.uid]: level
            }));

          }

        });

      });

    return () => unsubscribers.forEach((unsub) => unsub());

  }, [posts]);

  /* 저장 글 구독 */
  useEffect(() => {

    if (!user) return;

    const q = collection(db, "app_users", user.uid, "savedPosts");

    const unsub = onSnapshot(q, (snap) => {

      const ids = snap.docs.map((d) => d.id);
      setSavedPosts(ids);

    });

    return () => unsub();

  }, [user]);

  /* 저장 */
  const handleSave = async (postId) => {

    if (!user) return;

    const ref = doc(db, "app_users", user.uid, "savedPosts", postId);

    if (savedPosts.includes(postId)) {

      await deleteDoc(ref);

    } else {

      await setDoc(ref, {
        savedAt: new Date()
      });

    }

  };
if (showInstallPopup) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 30,
          width: "90%",
          maxWidth: 360,
          textAlign: "center"
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 10
          }}
        >
          LawHero 앱에서 이용하세요
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#6B7280",
            marginBottom: 24
          }}
        >
          커뮤니티 기능은 앱에서 제공됩니다
        </div>

        <button
          onClick={()=>{
            window.open(
              "https://play.google.com/store/apps/details?id=com.anonymous.lawhero"
            );
          }}
          style={{
            width:"100%",
            padding:14,
            marginBottom:10,
            background:"#111827",
            color:"white",
            border:"none",
            borderRadius:10,
            fontWeight:700
          }}
        >
          Google Play
        </button>

        <button
          onClick={()=>{
            window.open("https://apps.apple.com/");
          }}
          style={{
            width:"100%",
            padding:14,
            background:"#F3F4F6",
            border:"none",
            borderRadius:10,
            fontWeight:700
          }}
        >
          App Store
        </button>
      </div>
    </div>
  );
}
  return (
    <>
{showInstallPopup && (

<div
style={{
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,0.45)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:9999
}}
>

<div
style={{
background:"white",
borderRadius:20,
padding:30,
width:"90%",
maxWidth:360,
textAlign:"center"
}}
>

<div
style={{
fontSize:20,
fontWeight:800,
marginBottom:10
}}
>
LawHero 앱에서 이용하세요
</div>

<div
style={{
fontSize:14,
color:"#6B7280",
marginBottom:24
}}
>
커뮤니티 기능은 앱에서 제공됩니다
</div>

<button
onClick={()=>{
window.open(
"https://play.google.com/store/apps/details?id=com.anonymous.lawhero"
);
}}
style={{
width:"100%",
padding:14,
marginBottom:10,
background:"#111827",
color:"white",
border:"none",
borderRadius:10,
fontWeight:700,
cursor:"pointer"
}}
>
Google Play
</button>

<button
onClick={()=>{
window.open(
"https://apps.apple.com/"
);
}}
style={{
width:"100%",
padding:14,
background:"#F3F4F6",
border:"none",
borderRadius:10,
fontWeight:700,
cursor:"pointer"
}}
>
App Store
</button>

</div>

</div>

)}
    <div className="container">

      <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 20,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        커뮤니티
      </h1>

      <button
        onClick={() => nav("/community/tier")}
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
        }}
      >
        <FiHelpCircle size={22} color="#6B7280" />
      </button>
     <button
  onClick={() => {

    const isGuest = localStorage.getItem("guest") === "true";

    if (isGuest) {

      localStorage.removeItem("guest");
      nav("/auth");

      return;
    }

    nav("/community/write");

  }}
  style={{
    background: "#111827",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer"
  }}
>
  글쓰기
</button>
    </div>

      {/* 탭 */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 30
        }}
      >
        {MAIN_TABS.map((tab) => (

          <div
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            style={{
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
              color: mainTab === tab.key ? "#111827" : "#9CA3AF"
            }}
          >
            {tab.label}
          </div>

        ))}
      </div>
{mainTab === "expert" && (
  <div
    style={{
      display: "flex",
      gap: 10,
      marginBottom: 20,
      flexWrap: "wrap"
    }}
  >

    {EXPERT_FIELDS.map((field) => (

      <div
        key={field.key}
        onClick={() => setSelectedField(field.key)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 20,
          background:
            selectedField === field.key ? "#4F46E5" : "#F3F4F6",
          color:
            selectedField === field.key ? "white" : "#374151",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >

        <img
          src={field.image}
          style={{
            width: 16,
            height: 16
          }}
        />

        {field.label}

      </div>

    ))}

  </div>
)}
{/* 글 목록 */}
<div>

{/* =========================
   일반 글 (경험 / 전문가)
========================= */}
{mainTab !== "info" && (
  <div>
    {posts.map((post) => (

      <div
        key={post.id}
        onClick={() => navigate(`/community/${post.id}`)}
        style={{
          padding: "18px 0",
          borderBottom: "1px solid #E5E7EB",
          cursor: "pointer"
        }}
      >

        {/* 유저 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 10
          }}
        >

          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              overflow: "hidden",
              background: "#F3F4F6",
              marginRight: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {authorLevels[post.uid] > 0 ? (
              <img
                src={getProfileImage(authorLevels[post.uid])}
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <IoPerson size={18} color="#9CA3AF" />
            )}
          </div>

          <div>

            <div style={{ fontWeight: 700 }}>
              {post.nickname || "유저"}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#9CA3AF"
              }}
            >
              {post.createdAt?.toDate?.().toLocaleString?.()}
            </div>

          </div>

        </div>

        {/* 제목 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6
          }}
        >

          <div style={{ display: "flex", alignItems: "center" }}>

            {post.likeCount >= 10 && (
              <IoFlame
                size={16}
                color="#F97316"
                style={{ marginRight: 6 }}
              />
            )}

            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: 0
              }}
            >
              {post.title}
            </h3>

          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              handleSave(post.id);
            }}
          >
            {savedPosts.includes(post.id)
              ? <IoBookmark size={20} color="#4F46E5"/>
              : <IoBookmarkOutline size={20} color="#6B7280"/>
            }
          </div>

        </div>

        {/* 내용 */}
      <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10
  }}
>

  <p
    style={{
      color: "#374151",
      flex: 1,
      margin: 0
    }}
  >
    {post.content?.slice(0,120)}...
  </p>

  {post?.imageUrls?.[0] && (
    <img
      src={post.imageUrls[0]}
      style={{
        width: 70,
        height: 70,
        borderRadius: 8,
        objectFit: "cover"
      }}
    />
  )}

</div>

        {/* 태그 */}
        {post.subCategory && (
          <span
            style={{
              background: "#EEF2FF",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#4F46E5"
            }}
          >
            {post.subCategory}
          </span>
        )}

        {/* 좋아요 / 댓글 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 10
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <IoHeart
              size={14}
              color={post.likeCount >= 10 ? "#EF4444" : "#6B7280"}
            />
            <span>{post.likeCount || 0}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <IoChatbubbleOutline
              size={14}
              color="#6B7280"
            />
            <span>{post.commentCount || 0}</span>
          </div>

        </div>

      </div>

    ))}
  </div>
)}


{/* =========================
   정보 탭 (카드형)
========================= */}
{mainTab === "info" && (
  <div>

    {posts.map((post) => (

      <div
        key={post.id}
        onClick={() => navigate(`/community/${post.id}`)}
        style={{
          background: "#F9FAFB",
          borderRadius: 16,
          padding: 16,
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid #E5E7EB",
          cursor: "pointer"
        }}
      >

        <div style={{ display: "flex", flex: 1 }}>

          {/* 이미지 */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              overflow: "hidden",
              background: "#E5E7EB",
              marginRight: 14
            }}
          >
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            )}
          </div>

          {/* 텍스트 */}
          <div style={{ flex: 1 }}>

            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 6
              }}
            >
              {post.title}
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#6B7280"
              }}
            >
              {post.field}
              {post.subField && (
                <span style={{ color: "#9CA3AF" }}>
                  {" · "} {post.subField}
                </span>
              )}
            </div>

          </div>

        </div>

        <div style={{ color: "#D1D5DB", fontSize: 18 }}>
          ›
        </div>

      </div>

    ))}

  </div>
)}
</div>
</div>
</>
  );
}
