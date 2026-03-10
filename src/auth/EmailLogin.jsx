import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

export default function EmailLogin(){

const nav = useNavigate();
const [confirmPassword,setConfirmPassword] = useState("");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [loading,setLoading] = useState(false);
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
const handleLogin = async () => {

if(loading) return;
setLoading(true);

try{

const res = await signInWithEmailAndPassword(
auth,
email,
password
);

const uid = res.user.uid;

const snap = await getDoc(doc(db,"app_users",uid));
if(password !== confirmPassword){
alert("비밀번호가 일치하지 않습니다.");
setLoading(false);
return;
}
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

<div style={{
maxWidth:420,
margin:"0 auto",
padding:24
}}>

<h2>이메일 로그인</h2>

<input
placeholder="이메일"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{
width:"100%",
padding:12,
marginTop:20
}}
/>

<input
type="password"
placeholder="비밀번호"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{
width:"100%",
padding:12,
marginTop:12
}}
/>

<input
type="password"
placeholder="비밀번호 다시 입력"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
style={{
width:"100%",
padding:12,
marginTop:12
}}
/>

<button
onClick={handleLogin}
style={{
width:"100%",
padding:14,
marginTop:20
}}
>

{loading ? "로그인중..." : "로그인"}

</button>

<div style={{
marginTop:16,
textAlign:"center"
}}>

<button
onClick={handleResetPassword}
style={{
background:"none",
border:"none",
color:"#6B7280",
cursor:"pointer"
}}
>

비밀번호 찾기

</button>

</div>

</div>

);

}