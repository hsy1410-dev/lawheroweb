import { useEffect } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function KakaoCallback() {

  useEffect(() => {

    const login = async () => {

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) return;

      const res = await fetch(
        "https://api-z3zamhysqa-uc.a.run.app/auth/kakao/exchange",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri:
              "https://www.lawhero.kr/auth/kakao/callback"
          })
        }
      );

      const data = await res.json();

      await signInWithCustomToken(auth, data.firebaseToken);

      window.location.href = "/home";

    };

    login();

  }, []);

  return <div>카카오 로그인 중...</div>;
}
