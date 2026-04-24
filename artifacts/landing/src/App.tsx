const BOT_URL = "https://t.me/WinStar_seller_bot";
const BOT_DEEPLINK = "tg://resolve?domain=WinStar_seller_bot";

function openBot() {
  const w: any = window;
  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (typeof w.matchMedia === "function" &&
      w.matchMedia("(max-width: 820px)").matches);
  if (isMobile) {
    let opened = false;
    const t = setTimeout(() => {
      if (!opened) window.location.href = BOT_URL;
    }, 600);
    window.addEventListener("blur", () => {
      opened = true;
      clearTimeout(t);
    });
    window.location.href = BOT_DEEPLINK;
  } else {
    window.open(BOT_URL, "_blank", "noopener,noreferrer");
  }
}

const FEATURES = [
  {
    icon: "🛡",
    title: "Stealth & safety",
    body: "Anti-detection layers tuned for low-ban-rate. Quick rotation when patches drop.",
  },
  {
    icon: "⚡",
    title: "Instant delivery",
    body: "Once payment is approved, your one-time key arrives in the bot in seconds.",
  },
  {
    icon: "💎",
    title: "Daily / weekly / monthly",
    body: "Pick exactly the period you need. Pay in crypto (BEP20 USDT) or India UPI via Remitly.",
  },
  {
    icon: "🌐",
    title: "EN · RU · HI support",
    body: "Multilingual interface and admin support directly inside Telegram.",
  },
];

const GAMES = [
  "PUBG Global",
  "PUBG Korea",
  "PUBG Vietnam",
  "PUBG Taiwan",
  "BGMI",
  "Call of Duty Mobile",
  "Mobile Legends",
  "8 Ball Pool",
];

function App() {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const posterSrc = `${base}/poster.jpeg`;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        color: "#e8edff",
        fontFamily:
          "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background:
          "radial-gradient(1200px 600px at 80% -10%, rgba(124,77,255,.35), transparent 60%), radial-gradient(900px 600px at -10% 30%, rgba(0,209,255,.25), transparent 60%), linear-gradient(180deg, #07091a 0%, #0a0d24 60%, #060818 100%)",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "28px 24px 64px",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 0.4,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 34,
                height: 34,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, #7c4dff 0%, #00d1ff 100%)",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 30px rgba(124,77,255,.45)",
              }}
            >
              ⚡
            </span>
            WinStar
          </div>
          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              color: "#b9c0ff",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,.12)",
              padding: "8px 14px",
              borderRadius: 999,
            }}
          >
            @WinStar_seller_bot
          </a>
        </header>

        {/* Hero */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 420px)",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#9aa3ff",
                background: "rgba(124,77,255,.15)",
                border: "1px solid rgba(124,77,255,.4)",
                padding: "6px 12px",
                borderRadius: 999,
                marginBottom: 18,
              }}
            >
              🔥 Premium cheats · Telegram delivery
            </span>
            <h1
              style={{
                fontSize: "clamp(36px, 6vw, 64px)",
                lineHeight: 1.05,
                margin: "0 0 18px",
                fontWeight: 800,
                letterSpacing: -1,
                background:
                  "linear-gradient(90deg, #ffffff 0%, #c8cdff 50%, #8af1ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              WinStar / Winios cheat keys —{" "}
              <span style={{ whiteSpace: "nowrap" }}>buy in Telegram.</span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "#a9b1d6",
                maxWidth: 560,
                margin: "0 0 28px",
                lineHeight: 1.55,
              }}
            >
              Pick your game, choose a period, pay in crypto or UPI, and
              receive a one-time key the moment your payment is approved.
              Everything happens inside @WinStar_seller_bot.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={openBot}
                style={{
                  cursor: "pointer",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 17,
                  padding: "16px 28px",
                  borderRadius: 14,
                  color: "#0b0d22",
                  background:
                    "linear-gradient(135deg, #7c4dff 0%, #00d1ff 100%)",
                  boxShadow:
                    "0 18px 40px rgba(0,209,255,.35), 0 6px 20px rgba(124,77,255,.45)",
                  transition: "transform .15s ease",
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(0.98)";
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1)";
                }}
              >
                🚀 Open in Telegram
              </button>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "16px 22px",
                  borderRadius: 14,
                  color: "#e8edff",
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(255,255,255,.04)",
                }}
              >
                t.me/WinStar_seller_bot
              </a>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#7a83b0",
                marginTop: 18,
              }}
            >
              On mobile the button opens the Telegram app. On desktop it
              opens t.me in a new tab.
            </p>
          </div>

          {/* Poster */}
          <div
            style={{
              position: "relative",
              borderRadius: 28,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,.1)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.0) 100%)",
              boxShadow: "0 30px 80px rgba(0,0,0,.55)",
            }}
          >
            <img
              src={posterSrc}
              alt="WinStar poster"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 60%, rgba(7,9,26,.85) 100%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 18,
                bottom: 16,
                fontWeight: 700,
                fontSize: 14,
                color: "#fff",
                textShadow: "0 2px 12px rgba(0,0,0,.6)",
              }}
            >
              🎮 PUBG · CODM · ML · 8BP
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          style={{
            marginTop: 72,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                padding: "22px 22px 24px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01))",
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 6,
                  color: "#ffffff",
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "#a9b1d6",
                }}
              >
                {f.body}
              </div>
            </div>
          ))}
        </section>

        {/* Supported games */}
        <section style={{ marginTop: 56 }}>
          <h2
            style={{
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#8d96c4",
              margin: "0 0 14px",
              fontWeight: 600,
            }}
          >
            Supported titles
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {GAMES.map((g) => (
              <span
                key={g}
                style={{
                  fontSize: 14,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "#dfe3ff",
                }}
              >
                {g}
              </span>
            ))}
          </div>
        </section>

        {/* CTA strip */}
        <section
          style={{
            marginTop: 64,
            padding: "26px 28px",
            borderRadius: 22,
            border: "1px solid rgba(124,77,255,.35)",
            background:
              "linear-gradient(135deg, rgba(124,77,255,.18) 0%, rgba(0,209,255,.12) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 4,
                color: "#fff",
              }}
            >
              Ready to win?
            </div>
            <div style={{ color: "#bcc4f0", fontSize: 14 }}>
              Continue the purchase inside Telegram — it takes less than a
              minute.
            </div>
          </div>
          <button
            type="button"
            onClick={openBot}
            style={{
              cursor: "pointer",
              border: "none",
              fontWeight: 700,
              fontSize: 16,
              padding: "14px 24px",
              borderRadius: 12,
              color: "#0b0d22",
              background: "linear-gradient(135deg, #7c4dff 0%, #00d1ff 100%)",
              boxShadow: "0 12px 28px rgba(0,209,255,.35)",
            }}
          >
            🚀 Open @WinStar_seller_bot
          </button>
        </section>

        <footer
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,.06)",
            color: "#6a73a0",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>© WinStar · Telegram-only delivery</span>
          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#9aa3ff", textDecoration: "none" }}
          >
            @WinStar_seller_bot →
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
