import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pop from "../assets/pop.png";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import icon6 from "../assets/6.png";
import icon7 from "../assets/7.png";
import icon8 from "../assets/8.png";
import icon9 from "../assets/9.png";
import icon10 from "../assets/10.png";

import lawbe from "../assets/lawbe.png";
import logo from "../assets/icon1.png";
import bannerImg from "../assets/house.png";
import { auth } from "../firebase/firebase";
import g from "../assets/g.png";
import civil from "../assets/civil.png";
import bankruptcy from "../assets/bankruptcy.png";
import divorce from "../assets/divorce.png";
import realestate from "../assets/realestate.png";
import "./Home.css"
const CATEGORY_CONFIG = {

  "형사": {
    icon: icon6,
    color: "#16A34A",
  },

  "민사": {
    icon: icon7,
    color: "#F97316",
  },

  "도산/개인회생": {
    icon: icon8,
    color: "#5B5BD6",
  },

  "이혼": {
    icon: icon9,
    color: "#EC4899",
  },

  "부동산": {
    icon: icon10,
    color: "#2DD4BF",
  },

};
const categories = [

  {
    key: "criminal",
    title: "형사",
    sub: "수사/처벌",
    icon: g,
  },

  {
    key: "civil",
    title: "민사",
    sub: "소송/절차",
    icon: civil,
  },

  {
    key: "bankruptcy",
    title: "도산",
    icon: bankruptcy,
  },

  {
    key: "divorce",
    title: "이혼",
    icon: divorce,
  },

  {
    key: "realestate",
    title: "부동산",
    icon: realestate,
  },

];
export default function Home() {

  const navigate = useNavigate();
const [unreadCount, setUnreadCount] = useState(0);
  const [expertPosts, setExpertPosts] = useState([]);
  const [infoPosts, setInfoPosts] = useState([]);
const [showInstallPopup, setShowInstallPopup] = useState(false);
const [showBanner, setShowBanner] = useState(false);
useEffect(() => {

  const saved = localStorage.getItem("hideBanner");

  if (!saved) {
    setShowBanner(true);
    return;
  }

  const expire = Number(saved);

  if (Date.now() > expire) {
    localStorage.removeItem("hideBanner");
    setShowBanner(true);
  }

}, []);
const handleHideToday = () => {

  const now = new Date();

  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  localStorage.setItem(
    "hideBanner",
    tomorrow.getTime()
  );

  setShowBanner(false);

};
  useEffect(() => {

    const q = query(
      collection(db, "community_posts"),
      where("category", "==", "expert")
    );

    return onSnapshot(q, (snap) => {

      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setExpertPosts(data.slice(0, 3));

    });

  }, []);

  /* 정보 글 */
const handleQuickConsult = () => {

  const guest = localStorage.getItem("guest");

  if (guest) {
    alert("상담을 이용하려면 로그인이 필요합니다.");

    localStorage.removeItem("guest"); // 게스트 삭제
    navigate("/auth");

    return;
  }

  navigate("/consult/quick");
};
 /* INFO 글 */

useEffect(() => {
  const q = query(
    collection(db, "community_posts"),
    where("category", "==", "info")
  );

  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setInfoPosts(data.slice(0, 5));
  });

  return () => unsub();
}, []);


/* EXPERT 글 */

useEffect(() => {
  const q = query(
    collection(db, "community_posts"),
    where("category", "==", "expert"),
  );

  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setExpertPosts(data.slice(0, 3));
  });

  return () => unsub();
}, []);


/* 알림 */

useEffect(() => {

  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "notifications"),
    where("uid", "==", user.uid),
    where("isRead", "==", false)
  );

  return onSnapshot(q, (snap) => {
    setUnreadCount(snap.size);
  });

}, []);

return (

<div className="c" style={{
background:"#F5F6F8",
minHeight:"100vh",
maxWidth:720,
margin:"0 auto"
}}>

{/* HERO */}

<div
  style={{
    background: "#9CC2FC",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 80,
    paddingBottom: 20,
    position: "relative"   // ⭐ 추가
  }}
>

{/* TOPBAR */}

<div
  style={{
    position: "absolute",
    top: 16,
    left: 20,
    display: "flex",
    alignItems: "center"
  }}
>

<img
  src={logo}
  style={{
    width: 32
  }}
/>

</div>
{/* HERO ROW */}

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}>

<div style={{marginLeft:20}}>

<div style={{
fontSize:20,
fontWeight:600,
color:"#4F46E5"
}}>
궁금한 법률 고민
</div>

<div style={{
fontSize:18,
fontWeight:600,
color:"#4F46E5"
}}>
로비에게 물어보세요!
</div>

</div>

<img src={lawbe} style={{width:160,zIndex:1}}/>

</div>

{/* 빠른 상담 */}

{/* 빠른 상담 */}
<div
  style={{
    marginTop: -30,
    marginLeft: 16,
    marginRight: 16,
    background: "linear-gradient(90deg,#9987FF,#5F92FF)",
    borderRadius: 30,
    padding: 2,
    zIndex:2
  }}
>

  <div
  onClick={handleQuickConsult}
  style={{
    display: "flex",
    alignItems: "center",
    background: "#F3F4F6",
    padding: "14px 12px",
    borderRadius: 28,
    cursor: "pointer",
    zIndex: 9
  }}
>

    {/* 아이콘 */}
    <img
      src={g}
      style={{
        width: 50,
        marginRight: 16
      }}
    />

    {/* 텍스트 */}
    <div style={{ flex: 1 }}>

      <div
        style={{
          fontSize: 14,
          color: "#6B7280"
        }}
      >
        기다릴 필요없이 법률 고민
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700
        }}
      >
        빠른 상담
      </div>

    </div>

    {/* 버튼 */}
    <div
      style={{
        background: "#E5E7EB",
        padding: "12px 18px",
        borderRadius: 40,
        fontWeight: 700,
        color: "#4F46E5",
        zIndex:2
      }}
    >
      시작하기
    </div>

  </div>

</div>

</div>

{/* 추천 서비스 */}
<div
  style={{
    fontSize: 20,
    fontWeight: 600,
    marginTop: 20,
    marginLeft: 20
  }}
>
추천하는 상담 서비스
</div>

<div
  style={{
    display: "flex",
     gap: 20 ,
    padding: "20px 16px 0"
  }}
>

{categories.slice(0,2).map((item)=>(
<div
key={item.title}
onClick={() =>
navigate("/consult/general", {
state:{category:item.key}
})
}
style={{
width:"calc(50% - 10px)",
background:"#F3F4F6",
borderRadius:28,
padding:20,
cursor:"pointer",

border:"1px solid #E5E7EB",

position:"relative",   // ⭐ 중요
minHeight:120
}}
>

<div>

<div
style={{
fontSize:22,
fontWeight:800
}}
>
{item.title}
</div>

{item.sub && (
<div
style={{
color:"#9CA3AF",
marginTop:6
}}
>
{item.sub}
</div>
)}

</div>

<img
src={item.icon}
style={{
width:70,
position:"absolute",
right:12,
bottom:10
}}
/>

</div>
))}

</div>
<div
style={{
display:"flex",
 gap: 20 ,
padding:"16px"
}}
>

{categories.slice(2).map((item)=>(
<div
key={item.title}
onClick={() =>
navigate("/consult/general", {
state:{category:item.key}
})
}
style={{
width:"calc(33.33% - 10px)",
background:"#F3F4F6",
borderRadius:22,
padding:"16px",
cursor:"pointer",

border:"1px solid #E5E7EB",
boxShadow:"0 2px 8px rgba(0,0,0,0.04)",

position:"relative",   // ⭐ 중요
minHeight:100
}}
>

<div
style={{
fontSize:16,
fontWeight:700
}}
>
{item.title}
</div>

<img
src={item.icon}
style={{
width:36,
position:"absolute",
right:10,
bottom:10
}}
/>

</div>
))}

</div>

{/* 배너 */}
<div
style={{
margin:16,
background:"#1C4788",
borderRadius:20,
padding:20,
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>

<div>

<div
style={{
fontSize:18,
color:"#C7D2FE"
}}
>
집을 유지하면서
</div>

<div
style={{
fontSize:20,
fontWeight:700,
color:"white"
}}
>
채무 조정 하고싶다면?
</div>

<div
style={{
color:"#ddd"
}}
>
전문가가 직접 상담
</div>

</div>

<img
src={bannerImg}
style={{
width:120
}}
/>

</div>
<div style={{marginTop:20}}>

<div
style={{
fontSize:20,
fontWeight:600,
marginLeft:20
}}
>
변호사가 답한 실제 사례
</div>

<div
style={{
display:"flex",
gap:14,
overflowX:"auto",
padding:"16px 20px"
}}
>

{expertPosts.map((post)=>{

const config = CATEGORY_CONFIG[post.field];

return(

<div
key={post.id}
onClick={()=>setShowInstallPopup(true)}
style={{
minWidth:220,
background:"white",
borderRadius:20,
padding:16,
cursor:"pointer",
boxShadow:"0 4px 12px rgba(0,0,0,0.05)"
}}
>

<div
style={{
fontWeight:800,
fontSize:16,
marginBottom:12
}}
>
{post.title}
</div>

{config && (

<div
style={{
display:"flex",
alignItems:"center",
gap:6
}}
>

<img src={config.icon} style={{width:18}}/>

<div
style={{
fontSize:13,
color:config.color,
fontWeight:600
}}
>
{post.field} 분야
</div>

</div>

)}

</div>

)

})}

</div>

</div>
<div style={{marginTop:20}}>

<div
style={{
fontSize:20,
fontWeight:600,
marginLeft:20
}}
>
법률 정보 자세히 보기
</div>

<div style={{padding:"16px 20px"}}>

{infoPosts.map((post)=>(
<div
key={post.id}
onClick={()=>setShowInstallPopup(true)}
style={{
background:"#F9FAFB",
borderRadius:20,
padding:16,
marginBottom:18,
display:"flex",
justifyContent:"space-between",
alignItems:"center",
cursor:"pointer",
border:"1px solid #E5E7EB"
}}
>

<div style={{display:"flex"}}>

<div
style={{
  width:60,
  height:60,
  borderRadius:12,
  overflow:"hidden",
  background:"#E5E7EB"
}}
>
  {post.imageUrl && (
    <img
      src={post.imageUrl}
      style={{
        width:"100%",
        height:"100%",
        objectFit:"contain"
      }}
    />
  )}
</div>

<div>

<div
style={{
fontSize:17,
fontWeight:800,
marginBottom:6
}}
>
{post.title}
</div>

<div
style={{
fontSize:13,
color:"#9CA3AF"
}}
>
{post.field}
</div>

</div>

</div>

<div>›</div>

</div>
))}

</div>
{showInstallPopup && (

<div
style={{
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,0.4)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:999
}}
>

<div
style={{
background:"white",
borderRadius:20,
padding:28,
width:"90%",
maxWidth:340,
textAlign:"center"
}}
>

<div
style={{
fontSize:18,
fontWeight:700,
marginBottom:10
}}
>
로히어로 앱에서 확인하세요
</div>

<div
style={{
fontSize:14,
color:"#6B7280",
marginBottom:24
}}
>
전체 법률 사례는 앱에서 확인할 수 있습니다
</div>

{/* 플레이스토어 */}
<button
onClick={()=>{
window.open(
"https://play.google.com/store/apps/details?id=com.anonymous.lawhero"
);
}}
style={{
width:"100%",
padding:12,
marginBottom:10,
background:"#111827",
color:"white",
border:"none",
borderRadius:10,
fontWeight:600,
cursor:"pointer"
}}
>
Google Play
</button>

{/* 앱스토어 */}
<button
onClick={()=>{
window.open("https://apps.apple.com/");
}}
style={{
width:"100%",
padding:12,
background:"#F3F4F6",
border:"none",
borderRadius:10,
fontWeight:600,
cursor:"pointer"
}}
>
App Store
</button>

{/* 닫기 */}
<div
onClick={()=>setShowInstallPopup(false)}
style={{
marginTop:16,
fontSize:13,
color:"#9CA3AF",
cursor:"pointer"
}}
>
닫기
</div>

</div>

</div>

)}
</div>
</div>


)


}
