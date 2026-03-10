import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

import googleIcon from "../assets/google.png";
import kakaoIcon from "../assets/kakao.png";
import authImage from "../assets/auth_page.png";

export default function AuthLanding() {

  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) nav("/home");
    });

    return unsub;

  }, [nav]);

  /* Google 로그인 */

  const handleGoogleLogin = async () => {

    if (loading) return;
    setLoading(true);

    try {

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const uid = result.user.uid;

      const snap = await getDoc(doc(db, "app_users", uid));

      if (!snap.exists()) {
        nav("/auth/nickname");
        return;
      }

      const data = snap.data();

      if (!data?.nickname?.trim()) {
        nav("/auth/nickname");
        return;
      }

      if (!data?.phoneVerified) {
        nav("/auth/verify");
        return;
      }

      nav("/home");

    } catch (e) {

      console.error("GOOGLE LOGIN ERROR:", e);
      alert("구글 로그인 실패");

    } finally {

      setLoading(false);

    }
  };

  /* Kakao 로그인 */

  const handleKakaoLogin = () => {

    const redirectUri =
      "https://lawheroweb.vercel.app/auth/kakao/callback";

    const url =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=a1fbf977caeea589545f32274a254ab1` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;

    window.location.href = url;
  };

  return (

<div
style={{
background:"#F5F6F8",
minHeight:"100vh",
display:"flex",
justifyContent:"center",
flexDirection:"column",
alignItems:"center"
}}
>

<div
style={{
width:"100%",
maxWidth:420,
padding:"80px 24px 0 24px"
}}
>

{/* 제목 */}

<div
style={{
fontSize:28,
fontWeight:800,
textAlign:"center",
lineHeight:1.4,
marginBottom:40
}}
>
당신에게 맞는 <br/>
전문가와 연결됩니다
</div>

</div>

{/* 이미지 (전체폭) */}

<img
src={authImage}
style={{
  width: "100vw",
    maxWidth: 480,
marginBottom:60
}}
/>

{/* 버튼 영역 */}

<div
style={{
width:"100%",
maxWidth:420,
margin:"0 auto",
padding:"0 24px"
}}
>

{/* Google 버튼 */}

<button
onClick={handleGoogleLogin}
style={{
width:"100%",
background:"white",
border:"1px solid #E5E7EB",
padding:16,
borderRadius:18,
fontSize:16,
fontWeight:700,
cursor:"pointer",
display:"flex",
alignItems:"center",
justifyContent:"center",
marginBottom:16,
gap:10
}}
>

<img src={googleIcon} style={{width:20}}/>

{loading ? "로그인 중..." : "구글로 시작하기"}

</button>

{/* Kakao 버튼 */}

<button
onClick={handleKakaoLogin}
style={{
width:"100%",
background:"#FEE500",
border:"none",
padding:16,
borderRadius:18,
fontSize:16,
fontWeight:700,
cursor:"pointer",
display:"flex",
alignItems:"center",
justifyContent:"center",
gap:10
}}
>

<img src={kakaoIcon} style={{width:22}}/>

카카오로 시작하기

</button>
{/* Email 버튼 */}

<button
onClick={() => nav("/auth/email")}
style={{
width:"100%",
background:"#111827",
color:"white",
border:"none",
padding:16,
borderRadius:18,
fontSize:16,
fontWeight:700,
cursor:"pointer",
display:"flex",
alignItems:"center",
justifyContent:"center",
marginTop:16
}}
>

이메일로 로그인하기

</button>
</div>

</div>

  );

}