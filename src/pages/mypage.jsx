import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import {
  IoTimeOutline,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoHeadsetOutline
} from "react-icons/io5";
import { auth, db } from "../firebase/firebase";

import level1 from "../assets/1.png";
import level2 from "../assets/2.png";
import level3 from "../assets/3.png";
import level4 from "../assets/4.png";
import level5 from "../assets/5.png";
import lawyerImage from "../assets/lawyer.png";

export default function MyPage(){

const navigate = useNavigate();

const [user,setUser] = useState(null);
const [userData,setUserData] = useState(null);
const [coupons,setCoupons] = useState([]);

const getProfileImage = (level)=>{
switch(level){
case 1:return level1;
case 2:return level2;
case 3:return level3;
case 4:return level4;
case 5:return level5;
default:return null;
}
};

const quickMenus = [

{label:"최근 본 글",route:"/mypage/recent"},
{label:"관심글",route:"/mypage/likes"},
{label:"상담내역",route:"/chat"},
{label:"고객센터",route:"/support"}

];
const menus = [
  {
    icon: IoTimeOutline,
    label: "최근 본 글",
    route: "/mypage/recent"
  },
  {
    icon: IoHeartOutline,
    label: "관심글",
    route: "/mypage/likes"
  },
  {
    icon: IoChatbubbleOutline,
    label: "상담내역",
    route: "/chat"
  },
  {
    icon: IoHeadsetOutline,
    label: "고객센터",
    route: "/support"
  }
];
useEffect(()=>{

let unsubUser;
let unsubCoupons;

const unsubAuth = onAuthStateChanged(auth,(u)=>{

setUser(u);

if(!u) return;

const userRef = doc(db,"app_users",u.uid);

unsubUser = onSnapshot(userRef,(snap)=>{
if(snap.exists()){
setUserData(snap.data());
}
});

const couponRef = collection(db,"app_users",u.uid,"coupons");

unsubCoupons = onSnapshot(couponRef,(snap)=>{

const list = snap.docs.map(d=>({
id:d.id,
...d.data()
}));

setCoupons(list);

});

});

return ()=>{

unsubUser && unsubUser();
unsubCoupons && unsubCoupons();
unsubAuth();

};

},[]);

const handleLogout = async()=>{

const ok = window.confirm("정말 로그아웃 하시겠습니까?");

if(!ok) return;

await signOut(auth);

navigate("/auth");

};

const renderProfileImage = ()=>{

if(userData?.role==="lawyer"){
return <img src={lawyerImage} style={{width:64,height:64,borderRadius:32}}/>
}

if(userData?.profileLevel>0){
return <img src={getProfileImage(userData.profileLevel)} style={{width:64,height:64,borderRadius:32}}/>
}

return (
<div style={{
width:64,
height:64,
borderRadius:32,
background:"#E5E7EB"
}}/>
)

};

return(

<div style={{
maxWidth:720,
margin:"0 auto",
background:"#F5F6F8",
minHeight:"100vh"
}}>

<div style={{
padding:20,
paddingTop:60
}}>

<h1 style={{
fontSize:26,
fontWeight:700,
marginBottom:24
}}>
내정보
</h1>

{/* 유저 카드 */}

<div style={{
display:"flex",
alignItems:"center",
marginBottom:28
}}>

<div style={{
marginRight:16
}}>
{renderProfileImage()}
</div>

<div>

<div style={{
fontWeight:700,
fontSize:18
}}>
{userData?.nickname || "유저명"}
</div>

<div style={{
color:"#9CA3AF",
marginTop:4
}}>
{user?.email}
</div>

</div>

</div>

{/* 빠른 메뉴 */}

<div style={{
display:"flex",
flexDirection:"column",
marginBottom:28
}}>
  <div
  key={menus.route}
  onClick={() => navigate(menu.route)}
  style={{
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #E5E7EB",
    cursor: "pointer",
    gap: 14,
    width:"100%"
  }}
>
  </div>
</div>
{/* 커뮤니티 */}

<div style={{color:"#9CA3AF",marginBottom:10}}>
커뮤니티 활동
</div>

<Row label="내 커뮤니티 글" route="/mypage/my-posts"/>
<Row label="커뮤니티 관심 글" route="/mypage/likes"/>
<Row label="저장한 글" route="/mypage/saved"/>
<Row label="작성한 댓글" route="/mypage/comments"/>

<hr style={{margin:"24px 0"}}/>

{/* 고객지원 */}

<div style={{color:"#9CA3AF",marginBottom:10}}>
고객지원
</div>
<Row label="약관 및 정책" route="/policy"/>

{/* 쿠폰 */}

<div style={{
color:"#9CA3AF",
marginTop:30,
marginBottom:10
}}>
🎫 보유 쿠폰
</div>

<div style={{
background:"#F9FAFB",
borderRadius:14,
padding:16
}}>

{coupons.length===0 && (
<div style={{color:"#9CA3AF"}}>
보유한 쿠폰이 없습니다.
</div>
)}

{coupons.map(coupon=>{

const isExpired =
coupon.expiredAt &&
new Date(coupon.expiredAt.seconds*1000) < new Date();

return(

<div key={coupon.id}
style={{
padding:"12px 0",
borderBottom:"1px solid #E5E7EB",
opacity: coupon.used || isExpired ? 0.5 : 1
}}
>

<div style={{fontWeight:600}}>

{coupon.type==="consult_support" && "상담지원 쿠폰"}
{coupon.type==="lawyer_fee_30" && "선임료 30% 지원"}
{coupon.type==="lawyer_fee_50" && "선임료 50% 지원"}

</div>

{coupon.expiredAt && (

<div style={{
fontSize:12,
color:"#9CA3AF",
marginTop:4
}}>

유효기간 {new Date(coupon.expiredAt.seconds*1000).toLocaleDateString()}

</div>

)}

{coupon.used && (
<div style={{fontSize:12,color:"#EF4444"}}>
사용 완료
</div>
)}

{isExpired && !coupon.used && (
<div style={{fontSize:12,color:"#EF4444"}}>
만료된 쿠폰
</div>
)}

</div>

)

})}

</div>

{/* 로그아웃 */}

<button
onClick={handleLogout}
style={{
marginTop:40,
width:"100%",
background:"#F3F4F6",
border:"none",
padding:16,
borderRadius:14,
fontWeight:600,
fontSize:16,
cursor:"pointer"
}}
>
로그아웃
</button>

</div>

</div>

)

}

function Row({label,route}){

const navigate = useNavigate();

return(

<div
onClick={()=>navigate(route)}
style={{
display:"flex",
justifyContent:"space-between",
padding:"16px 0",
cursor:"pointer"
}}
>

<div style={{fontSize:16,fontWeight:500}}>
{label}
</div>

<div style={{color:"#C7C7CC"}}>
›
</div>

</div>

)

}