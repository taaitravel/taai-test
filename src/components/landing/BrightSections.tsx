import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Continuation of the "bright edition" landing experience, rendered in React
 * below the static hero/journey scenes. Styling reuses the bright design tokens
 * (defined by the landing stylesheet) so the page reads as one continuous piece.
 */

const CSS = `
.tbs{
  --tbs-cream:var(--cream,#FAF7F2);
  --tbs-card:var(--card,#FFFFFF);
  --tbs-ink:var(--ink,#171310);
  --tbs-ink2:var(--ink-2,rgba(23,19,16,.62));
  --tbs-ink3:var(--ink-3,rgba(23,19,16,.36));
  --tbs-line:var(--line,rgba(23,19,16,.09));
  --tbs-line2:var(--line-2,rgba(23,19,16,.055));
  --tbs-grad:var(--grad,linear-gradient(105deg,#FF849C 0%,#FFA98F 48%,#FFCE87 100%));
  --tbs-deep:var(--grad-deep,linear-gradient(105deg,#F2536E 0%,#EE7C5C 50%,#E2913C 100%));
  --tbs-display:var(--display,"Sora",-apple-system,sans-serif);
  --tbs-body:var(--body,"Inter",-apple-system,sans-serif);
  --tbs-script:var(--script,"Yellowtail",cursive);
  --tbs-mono:var(--mono,"IBM Plex Mono",ui-monospace,monospace);
  --tbs-ease:cubic-bezier(.22,.61,.28,1);
  background:var(--tbs-cream);color:var(--tbs-ink);font-family:var(--tbs-body);
  position:relative;z-index:1;
}
.tbs *{box-sizing:border-box}
.tbs-wrap{max-width:1320px;margin:0 auto;padding:0 40px}
.tbs-sec{padding:108px 0;border-top:1px solid var(--tbs-line2)}
.tbs-sec.alt{background:linear-gradient(180deg,var(--tbs-cream),#F3EDE4)}
.tbs-mono{font-family:var(--tbs-mono);font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--tbs-ink3)}
.tbs-script{font-family:var(--tbs-script);font-size:26px;line-height:1;color:#E2913C}
.tbs-h2{font-family:var(--tbs-display);font-weight:300;font-size:clamp(30px,4vw,52px);line-height:1.04;
  letter-spacing:-.038em;margin:10px 0 16px}
.tbs-h2 b{font-weight:600;background:var(--tbs-deep);-webkit-background-clip:text;background-clip:text;color:transparent}
.tbs-lead{font-size:17px;line-height:1.62;color:var(--tbs-ink2);max-width:46ch;margin:0}
.tbs-head{margin-bottom:44px}

.tbs-lanes{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.tbs-lane{position:relative;text-align:left;background:var(--tbs-card);border:1px solid var(--tbs-line);
  border-radius:20px;padding:26px;cursor:pointer;font-family:inherit;color:inherit;
  box-shadow:0 2px 6px -2px rgba(90,50,30,.10);
  transition:transform .45s var(--tbs-ease),box-shadow .45s var(--tbs-ease),border-color .45s var(--tbs-ease)}
.tbs-lane:hover{transform:translateY(-3px);box-shadow:0 26px 50px -28px rgba(90,50,30,.4)}
.tbs-lane[aria-pressed="true"]{border-color:rgba(242,83,110,.5);box-shadow:0 26px 60px -30px rgba(242,83,110,.55)}
.tbs-lane .tbs-ic{width:44px;height:44px;border-radius:14px;background:var(--tbs-grad);display:grid;place-items:center;
  margin-bottom:18px;color:#171310}
.tbs-lane h3{font-family:var(--tbs-display);font-weight:600;font-size:19px;letter-spacing:-.02em;margin:0 0 6px}
.tbs-lane p{margin:0;font-size:14.5px;color:var(--tbs-ink2);line-height:1.55}
.tbs-lane .tbs-tick{position:absolute;top:22px;right:22px;font-family:var(--tbs-mono);font-size:9px;
  letter-spacing:.14em;text-transform:uppercase;color:transparent}
.tbs-lane[aria-pressed="true"] .tbs-tick{background:var(--tbs-deep);-webkit-background-clip:text;background-clip:text}
.tbs-actions{display:flex;align-items:center;gap:18px;margin-top:34px;flex-wrap:wrap}
.tbs-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:999px;font-size:13.5px;
  font-family:inherit;font-weight:600;padding:14px 26px;border:1px solid transparent;cursor:pointer;
  transition:transform .4s var(--tbs-ease),box-shadow .4s var(--tbs-ease),background .4s var(--tbs-ease)}
.tbs-btn-grad{background:var(--tbs-deep);color:#fff;box-shadow:0 12px 28px -14px rgba(242,83,110,.85)}
.tbs-btn-grad:hover:not(:disabled){transform:translateY(-1.5px);box-shadow:0 18px 34px -14px rgba(242,83,110,1)}
.tbs-btn-grad:disabled{opacity:.42;cursor:not-allowed;box-shadow:none}
.tbs-btn-ghost{border-color:var(--tbs-line);color:var(--tbs-ink);background:rgba(255,255,255,.7);font-weight:500}
.tbs-btn-ghost:hover{border-color:rgba(23,19,16,.24);background:#fff}
.tbs-hint{font-family:var(--tbs-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tbs-ink3)}

.tbs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.tbs-card{background:var(--tbs-card);border:1px solid var(--tbs-line);border-radius:18px;padding:24px;
  box-shadow:0 2px 6px -2px rgba(90,50,30,.10);
  transition:transform .45s var(--tbs-ease),box-shadow .45s var(--tbs-ease)}
.tbs-card:hover{transform:translateY(-3px);box-shadow:0 26px 50px -28px rgba(90,50,30,.4)}
.tbs-card .n{font-family:var(--tbs-mono);font-size:10px;letter-spacing:.15em;color:var(--tbs-ink3)}
.tbs-card h3{font-family:var(--tbs-display);font-weight:600;font-size:17px;letter-spacing:-.02em;margin:14px 0 7px}
.tbs-card p{margin:0;font-size:14.5px;line-height:1.6;color:var(--tbs-ink2)}
.tbs-card .bar{height:2px;width:34px;border-radius:2px;background:var(--tbs-deep);margin-top:18px}

.tbs-cta{position:relative;overflow:hidden;text-align:center;padding:118px 0 126px;color:var(--tbs-ink);
  background:linear-gradient(180deg,#F3EDE4 0%,var(--tbs-cream) 62%,var(--tbs-cream) 100%);
  border-top:1px solid var(--tbs-line2)}
.tbs-cta .orbx,.tbs-cta .orby{position:absolute;border-radius:50%;background:var(--tbs-grad);
  pointer-events:none;filter:blur(96px);will-change:transform}
.tbs-cta .orbx{width:540px;height:540px;opacity:.34;top:-200px;right:-120px;
  animation:tbs-drift-a 20s ease-in-out infinite alternate}
.tbs-cta .orby{width:440px;height:440px;opacity:.26;bottom:-190px;left:-110px;
  animation:tbs-drift-b 26s ease-in-out infinite alternate}
@keyframes tbs-drift-a{
  0%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(-6vw,4vh,0) scale(1.1)}
  100%{transform:translate3d(3vw,7vh,0) scale(.94)}
}
@keyframes tbs-drift-b{
  0%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(5vw,-4vh,0) scale(1.08)}
  100%{transform:translate3d(-4vw,-6vh,0) scale(.93)}
}
.tbs-cta h2{font-family:var(--tbs-display);font-weight:300;font-size:clamp(30px,4.4vw,54px);line-height:1.04;
  letter-spacing:-.04em;margin:12px 0 16px;position:relative}
.tbs-cta h2 b{font-weight:600;background:var(--tbs-deep);-webkit-background-clip:text;background-clip:text;color:transparent}
.tbs-cta p{max-width:44ch;margin:0 auto 32px;color:var(--tbs-ink2);font-size:17px;line-height:1.62;position:relative}
.tbs-cta .tbs-actions{position:relative}
@media (prefers-reduced-motion:reduce){
  .tbs-cta .orbx,.tbs-cta .orby{animation:none}
}

@media (max-width:900px){
  .tbs-sec{padding:76px 0}
  .tbs-wrap{padding:0 24px}
  .tbs-lanes,.tbs-grid{grid-template-columns:1fr}
  .tbs-cta{padding:82px 0 88px}
}
`;

const FEATURES = [
  { n: "01", title: "Booking that lands", desc: "Flights, stays, activities and tables dock straight into the itinerary — no copy-paste between tabs." },
  { n: "02", title: "A map that stays quiet", desc: "Muted land, warm roads, gradient pins. The only saturated thing on screen is where you're going." },
  { n: "03", title: "One itinerary, five tabs", desc: "Overview, Plan, Bookings, Costs, People. The whole group sees the same trip in real time." },
  { n: "04", title: "Costs, split cleanly", desc: "Booked and unbooked totals by type, per-person splits and a ledger that always balances." },
  { n: "05", title: "Miles, in every step", desc: "Your travel specialist as a named companion in the chrome — listening, planning, routing, ready." },
  { n: "06", title: "Remembered, not re-asked", desc: "Travelers, currency, date format and the way you move stay preloaded for the next trip." },
];

export const BrightSections = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"individual" | "company" | null>(null);

  return (
    <div className="tbs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Lanes */}
      <section className="tbs-sec" id="lanes">
        <div className="tbs-wrap">
          <div className="tbs-head">
            <span className="tbs-script">the start</span>
            <h2 className="tbs-h2">
              How do you <b>travel?</b>
            </h2>
            <p className="tbs-lead">Pick your lane and taai tailors itself to the way you move.</p>
          </div>

          <div className="tbs-lanes">
            <button
              type="button"
              className="tbs-lane"
              aria-pressed={userType === "individual"}
              onClick={() => setUserType("individual")}
            >
              <span className="tbs-tick">Selected</span>
              <div className="tbs-ic">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3.4" />
                  <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
                </svg>
              </div>
              <h3>Individual travel</h3>
              <p>Personal trips and long weekends — planned, booked and remembered in one place.</p>
            </button>

            <button
              type="button"
              className="tbs-lane"
              aria-pressed={userType === "company"}
              onClick={() => setUserType("company")}
            >
              <span className="tbs-tick">Selected</span>
              <div className="tbs-ic">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20V7l7-3v16" />
                  <path d="M11 11h9v9" />
                  <path d="M15 20v-4h2v4" />
                </svg>
              </div>
              <h3>Corporate travel</h3>
              <p>Policy, approvals and shared budgets for teams that move often and report on all of it.</p>
            </button>
          </div>

          <div className="tbs-actions">
            <button
              type="button"
              className="tbs-btn tbs-btn-grad"
              disabled={!userType}
              onClick={() => navigate("/signup", { state: { userType } })}
            >
              Start your journey
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h15" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
            <span className="tbs-hint">{userType ? "Lane set · continue" : "Pick a lane to continue"}</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="tbs-sec alt" id="capability">
        <div className="tbs-wrap">
          <div className="tbs-head">
            <span className="tbs-script">the workspace</span>
            <h2 className="tbs-h2">
              Everything a trip needs, <b>in one surface.</b>
            </h2>
            <p className="tbs-lead">
              From search to receipts — taai keeps planning, booking, costs and people on the same page.
            </p>
          </div>

          <div className="tbs-grid">
            {FEATURES.map((f) => (
              <article className="tbs-card" key={f.n}>
                <span className="n">{f.n}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="bar" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="tbs-cta">
        <div className="orbx" />
        <div className="orby" />
        <div className="tbs-wrap">
          <span className="tbs-mono">contact us</span>
          <h2>
            Let's work
            <br />
            <b>together.</b>
          </h2>
          <p>
            Questions, partnerships or a trip you want help shaping — send us a note and a
            specialist gets back to you.
          </p>
          <div className="tbs-actions" style={{ justifyContent: "center" }}>
            <button type="button" className="tbs-btn tbs-btn-grad" onClick={() => navigate("/contact")}>
              Contact us
            </button>
            <button type="button" className="tbs-btn tbs-btn-ghost" onClick={() => navigate("/signup")}>
              Join taai
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default BrightSections;
