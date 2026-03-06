import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const [expertPosts, setExpertPosts] = useState([]);
  const [infoPosts, setInfoPosts] = useState([]);

  /* 전문가 글 */

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

  const categories = [
    { title: "형사", icon: icon6, field: "형사" },
    { title: "민사", icon: icon7, field: "민사" },
    { title: "도산/개인회생", icon: icon8, field: "도산/개인회생" },
    { title: "이혼", icon: icon9, field: "이혼" },
    { title: "부동산", icon: icon10, field: "부동산" }
  ];

return (

<div style={{
background:"#F5F6F8",
minHeight:"100vh",
maxWidth:720,
margin:"0 auto"
}}>

{/* HERO */}

<div style={{
background:"#9CC2FC",
borderBottomLeftRadius:28,
borderBottomRightRadius:28,
paddingTop:90,
paddingBottom:20
}}>

{/* TOPBAR */}

<div style={{
position:"absolute",
top:20,
left:20,
right:20,
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}>

<img src={logo} style={{width:30}} />

<div style={{display:"flex",gap:18}}>

</div>

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

<img src={lawbe} style={{width:160}}/>

</div>

{/* 빠른 상담 */}

<div style={{
marginTop:-30,
marginLeft:16,
marginRight:16,
background:"linear-gradient(90deg,#9987FF,#5F92FF)",
borderRadius:30,
padding:2
}}>

<div style={{
display:"flex",
alignItems:"center",
background:"#F3F4F6",
padding:"14px 12px",
borderRadius:28
}}>

<img src={g} style={{
width:50,
marginRight:16
}}/>

<div style={{flex:1}}>

<div style={{
fontSize:14,
color:"#6B7280"
}}>
기다릴 필요없이 법률 고민
</div>

<div style={{
fontSize:18,
fontWeight:700
}}>
빠른 상담
</div>

</div>

<div style={{
background:"#E5E7EB",
padding:"12px 18px",
borderRadius:40,
fontWeight:700,
color:"#4F46E5"
}}>
시작하기
</div>

</div>

</div>

</div>

{/* 추천 서비스 */}

<div style={{
fontSize:20,
fontWeight:600,
marginTop:20,
marginLeft:20
}}>
추천하는 상담 서비스
</div>

{/* 상단 2개 */}

<div style={{
display:"flex",
justifyContent:"space-between",
padding:"20px 16px 0"
}}>

<div style={{
width:"48%",
background:"#F3F4F6",
borderRadius:28,
padding:20,
position:"relative"
}}>

<div style={{
fontSize:22,
fontWeight:800
}}>
형사
</div>

<div style={{
color:"#9CA3AF",
marginTop:6
}}>
수사/처벌
</div>

</div>

<div style={{
width:"48%",
background:"#F3F4F6",
borderRadius:28,
padding:20
}}>

<div style={{
fontSize:22,
fontWeight:800
}}>
민사
</div>

<div style={{
color:"#9CA3AF",
marginTop:6
}}>
소송/절차
</div>

</div>

</div>

{/* 하단 3개 */}

<div style={{
display:"flex",
justifyContent:"space-between",
padding:"16px"
}}>

{["도산","이혼","부동산"].map((item)=>(
<div key={item}
style={{
width:"31%",
background:"#F3F4F6",
borderRadius:22,
padding:"16px",
textAlign:"center"
}}>

<div style={{
fontSize:16,
fontWeight:700
}}>
{item}
</div>

</div>
))}

</div>

{/* 배너 */}

<div style={{
margin:16,
background:"#1C4788",
borderRadius:20,
padding:20,
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}>

<div>

<div style={{
fontSize:18,
color:"#C7D2FE"
}}>
집을 유지하면서
</div>

<div style={{
fontSize:20,
fontWeight:700,
color:"white"
}}>
채무 조정 하고싶다면?
</div>

<div style={{
color:"#ddd"
}}>
전문가가 직접 상담
</div>

</div>

<img src={bannerImg} style={{width:120}}/>

</div>

</div>

)


}