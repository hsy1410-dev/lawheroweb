import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export default function EmailLogin(){

const nav = useNavigate();

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [confirmPassword,setConfirmPassword] = useState("");
const [loading,setLoading] = useState(false);

/* ------------------------
   비밀번호 찾기
------------------------ */

const handleResetPassword = async () => {

if(!email){
alert("이메일을 입력해주세요.");
return;
}

try{

await sendPasswordResetEmail(auth,email);

alert("비밀번호 재설정 메일을 보냈습니다.");

}catch(e){

console.error(e);
alert("이메일 전송 실패");

}

};

/* ------------------------
   로그인
------------------------ */

const handleLogin = async () => {

if(loading) return;

if(password !== confirmPassword){
alert("비밀번호가 일치하지 않습니다.");
return;
}

setLoading(true);

try{

const res = await signInWithEmailAndPassword(
auth,
email,
password
);

const uid = res.user.uid;

const snap = await getDoc(doc(db,"app_users",uid));

if(!snap.exists()){
nav("/auth/nickname");
return;
}

const data = snap.data();

if(!data?.nickname?.trim()){
nav("/auth/nickname");
return;
}

if(!data?.phoneVerified){
nav("/auth/verify");
return;
}

nav("/home");

}catch(e){

console.error(e);
alert("로그인 실패");

}finally{
setLoading(false);
}

};

return(

<div
style={{
background:"#F5F6F8",
minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center"
}}
>

<div
style={{
width:"100%",
maxWidth:420,
background:"white",
padding:"40px 28px",
borderRadius:20,
boxShadow:"0 8px 24px rgba(0,0,0,0.05)"
}}
>

{/* 제목 */}

<div
style={{
fontSize:26,
fontWeight:800,
textAlign:"center",
marginBottom:32
}}
>
이메일 로그인
</div>

{/* 이메일 */}

<input
placeholder="이메일"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{
width:"100%",
padding:14,
borderRadius:12,
border:"1px solid #E5E7EB",
fontSize:15,
marginBottom:14
}}
/>

{/* 비밀번호 */}

<input
type="password"
placeholder="비밀번호"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{
width:"100%",
padding:14,
borderRadius:12,
border:"1px solid #E5E7EB",
fontSize:15,
marginBottom:14
}}
/>

{/* 비밀번호 확인 */}

<input
type="password"
placeholder="비밀번호 다시 입력"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
style={{
width:"100%",
padding:14,
borderRadius:12,
border:"1px solid #E5E7EB",
fontSize:15,
marginBottom:22
}}
/>

{/* 로그인 버튼 */}

<button
onClick={handleLogin}
style={{
width:"100%",
background:"#111827",
color:"white",
padding:15,
border:"none",
borderRadius:14,
fontSize:16,
fontWeight:700,
cursor:"pointer"
}}
>

{loading ? "로그인 중..." : "로그인"}

</button>

{/* 비밀번호 찾기 */}

<div
style={{
marginTop:16,
textAlign:"center"
}}
>

<button
onClick={handleResetPassword}
style={{
background:"none",
border:"none",
color:"#6B7280",
fontSize:14,
cursor:"pointer"
}}
>

비밀번호 찾기

</button>

</div>

</div>

</div>

);

} 