export default function Home() {
  return (
    <div
      className="container"
      style={{
        textAlign: "center",
        paddingTop: 80,
        maxWidth: 700,
        margin: "0 auto"
      }}
    >

      {/* 제목 */}
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          marginBottom: 20
        }}
      >
        변호사 상담을 더 쉽고 빠르게
      </h1>

      {/* 설명 */}
      <p
        style={{
          fontSize: 18,
          color: "#6B7280",
          lineHeight: 1.6,
          marginBottom: 40
        }}
      >
        형사 · 이혼 · 부동산 · 민사 고민을  
        <strong> LawHero </strong>에서 빠르게 해결하세요.
      </p>

      {/* 버튼 영역 */}
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center"
        }}
      >

        {/* 앱 설치 */}
        <a href="/install">
          <button
            style={{
              background: "#111827",
              color: "white",
              padding: "14px 24px",
              borderRadius: 10,
              fontSize: 16,
              border: "none",
              cursor: "pointer"
            }}
          >
            📱 앱 설치하기
          </button>
        </a>

        {/* 커뮤니티 */}
        <a href="/home">
          <button
            style={{
              background: "#EEF2FF",
              color: "#4F46E5",
              padding: "14px 24px",
              borderRadius: 10,
              fontSize: 16,
              border: "none",
              cursor: "pointer"
            }}
          >
              로그인
          </button>
        </a>

      </div>

    </div>
  );
}