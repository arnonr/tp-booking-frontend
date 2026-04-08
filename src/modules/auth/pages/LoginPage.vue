<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const SSO_CONFIG = {
  client_id: import.meta.env.VITE_SSO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_SSO_REDIRECT_URI,
  scope: import.meta.env.VITE_SSO_SCOPE,
  state: import.meta.env.VITE_SSO_STATE,
  auth_url: import.meta.env.VITE_SSO_URL
}

const ssoUrl = computed(() => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SSO_CONFIG.client_id,
    redirect_uri: SSO_CONFIG.redirect_uri,
    scope: SSO_CONFIG.scope,
    state: SSO_CONFIG.state,
  })
  return `${SSO_CONFIG.auth_url}?${params.toString()}`
})

const isVisible = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isVisible.value = true
  })
})
</script>

<template>
  <div class="login-root">

    <!-- Left panel — Blueprint branding -->
    <div class="left-panel" :class="{ visible: isVisible }">
      <div class="grid-overlay"></div>
      <div class="scan-line"></div>

      <!-- Floating floor-plan shapes -->
      <div class="room-shapes" aria-hidden="true">
        <div class="room room-a">
          <div class="table-rect"></div>
          <span class="chair ca1"></span>
          <span class="chair ca2"></span>
          <span class="chair ca3"></span>
          <span class="chair ca4"></span>
          <span class="chair ca5"></span>
          <span class="chair ca6"></span>
        </div>
        <div class="room room-b">
          <div class="table-round"></div>
          <span class="chair cb1"></span>
          <span class="chair cb2"></span>
          <span class="chair cb3"></span>
          <span class="chair cb4"></span>
        </div>
        <div class="room room-c">
          <div class="table-rect"></div>
          <span class="chair cc1"></span>
          <span class="chair cc2"></span>
        </div>
        <!-- Connector lines -->
        <svg class="connector-svg" viewBox="0 0 300 400" fill="none">
          <path d="M60 80 L200 160 L240 280" stroke="rgba(56,189,248,0.2)" stroke-width="1" stroke-dasharray="4 6" />
          <path d="M30 200 L150 120" stroke="rgba(56,189,248,0.12)" stroke-width="1" stroke-dasharray="3 5" />
        </svg>
      </div>

      <div class="deco-ring deco-ring-1"></div>
      <div class="deco-ring deco-ring-2"></div>

      <!-- Brand content -->
      <div class="left-content">
        <div class="logo-row">
          <div class="logo-box">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="9" width="34" height="22" rx="3" stroke="currentColor" stroke-width="1.8" />
              <path d="M9 15h22M9 20h14M9 25h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <circle cx="32" cy="25" r="3.5" fill="rgba(56,189,248,0.25)" />
              <circle cx="32" cy="25" r="1.8" fill="currentColor" />
            </svg>
          </div>
          <span class="logo-label">TP Booking</span>
        </div>

        <h1 class="brand-heading">
          <span class="line1">ระบบจอง</span>
          <span class="line2">ห้องประชุม</span>
        </h1>

        <p class="brand-sub">มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>

        <ul class="feature-list" aria-label="คุณสมบัติระบบ">
          <li class="feature-item">
            <span class="fdot"></span>
            <span>จองห้องประชุมออนไลน์ตลอด 24 ชั่วโมง</span>
          </li>
          <li class="feature-item">
            <span class="fdot"></span>
            <span>ระบบอนุมัติและแจ้งเตือนอัตโนมัติ</span>
          </li>
          <li class="feature-item">
            <span class="fdot"></span>
            <span>ดูปฏิทินการจองแบบ Real-time</span>
          </li>
        </ul>

        <div class="badge-row">
          <span class="badge">KMUTNB</span>
          <span class="badge">v2.0</span>
          <span class="badge badge-live">● ออนไลน์</span>
        </div>
      </div>
    </div>

    <!-- Right panel — Login card -->
    <div class="right-panel" :class="{ visible: isVisible }">
      <div class="login-card">

        <div class="card-top">
          <div class="card-icon-wrap">
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="10" r="5" stroke="currentColor" stroke-width="1.8" />
              <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" />
            </svg>
          </div>
          <div>
            <h2 class="card-title">เข้าสู่ระบบ</h2>
            <p class="card-sub">ใช้บัญชีองค์กร KMUTNB ของคุณ</p>
          </div>
        </div>

        <div class="card-body">
          <a :href="ssoUrl" class="sso-btn" role="button" aria-label="เข้าสู่ระบบด้วย SSO">
            <span class="sso-shimmer"></span>
            <span class="sso-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="11" height="11" rx="2" />
                <path d="M10 11V7a4 4 0 1 1 8 0v4" />
              </svg>
            </span>
            <span class="sso-label">เข้าสู่ระบบด้วย SSO</span>
            <span class="sso-arrow">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clip-rule="evenodd" />
              </svg>
            </span>
          </a>

          <div class="sep">
            <span class="sep-line"></span>
            <span class="sep-text">หรือ</span>
            <span class="sep-line"></span>
          </div>

          <div class="forgot-box">
            <div class="forgot-icon-wrap">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="10" cy="10" r="7.5" />
                <path d="M10 10.5v-.75a2.25 2.25 0 1 1 2.25 2.25" stroke-linecap="round" />
                <circle cx="10" cy="13.5" r=".75" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div class="forgot-content">
              <span class="forgot-label">ลืมรหัสผ่านบัญชีองค์กร?</span>
              <a href="https://account.kmutnb.ac.th/web/recovery/password" target="_blank" rel="noopener noreferrer"
                class="forgot-link">
                รีเซ็ตรหัสผ่าน
                <svg class="ext-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M5.5 2.5H3a1 1 0 0 0-1 1V11a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V8.5" />
                  <path d="M8.5 2.5H11.5V5.5" />
                  <line x1="11.5" y1="2.5" x2="6.5" y2="7.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <span>© 2569 Technopark — ระบบจองห้องประชุม</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

/* ─── Root layout ─────────────────────────────────────────── */
.login-root {
  display: flex;
  min-height: 100vh;
  font-family: 'Sarabun', sans-serif;
}

/* ─── Left panel ──────────────────────────────────────────── */
.left-panel {
  flex: 0 0 56%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  background: linear-gradient(145deg, #030b18 0%, #071527 45%, #0b1f3d 100%);
  opacity: 0;
  transform: translateX(-24px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}

.left-panel.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Blueprint dot-grid */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(56, 189, 248, 0.18) 1px, transparent 1px);
  background-size: 36px 36px;
  background-position: 18px 18px;
}

/* Animated scan line */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent);
  animation: scanDown 6s linear infinite;
}

@keyframes scanDown {
  0% {
    top: 0%;
    opacity: 0;
  }

  5% {
    opacity: 1;
  }

  95% {
    opacity: 1;
  }

  100% {
    top: 100%;
    opacity: 0;
  }
}

/* ── Floor-plan shapes ───────────────────────────────────── */
.room-shapes {
  position: absolute;
  right: 6%;
  top: 50%;
  transform: translateY(-50%);
  width: 300px;
  height: 400px;
  pointer-events: none;
}

.connector-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.room {
  position: absolute;
  border: 1.5px solid rgba(56, 189, 248, 0.3);
  border-radius: 5px;
  background: rgba(56, 189, 248, 0.03);
}

.room-a {
  width: 170px;
  height: 110px;
  top: 40px;
  left: 20px;
  animation: floatA 9s ease-in-out infinite;
}

.room-b {
  width: 100px;
  height: 100px;
  bottom: 60px;
  right: 10px;
  border-radius: 8px;
  animation: floatB 11s ease-in-out infinite 1.5s;
}

.room-c {
  width: 130px;
  height: 80px;
  bottom: 80px;
  left: 10px;
  opacity: 0.55;
  animation: floatA 13s ease-in-out infinite 3s reverse;
}

@keyframes floatA {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}

@keyframes floatB {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-8px) rotate(1deg);
  }
}

.table-rect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56%;
  height: 38%;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 3px;
}

.table-round {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 54%;
  height: 54%;
  background: rgba(56, 189, 248, 0.07);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 50%;
}

.chair {
  position: absolute;
  width: 11px;
  height: 11px;
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 2px;
  background: rgba(56, 189, 248, 0.12);
}

/* Room A chairs */
.ca1 {
  top: 10%;
  left: 15%;
}

.ca2 {
  top: 10%;
  left: 40%;
}

.ca3 {
  top: 10%;
  right: 15%;
}

.ca4 {
  bottom: 10%;
  left: 15%;
}

.ca5 {
  bottom: 10%;
  left: 40%;
}

.ca6 {
  bottom: 10%;
  right: 15%;
}

/* Room B chairs */
.cb1 {
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
}

.cb2 {
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
}

.cb3 {
  left: 8%;
  top: 50%;
  transform: translateY(-50%);
}

.cb4 {
  right: 8%;
  top: 50%;
  transform: translateY(-50%);
}

/* Room C chairs */
.cc1 {
  top: 50%;
  left: 12%;
  transform: translateY(-50%);
}

.cc2 {
  top: 50%;
  right: 12%;
  transform: translateY(-50%);
}

/* Decorative rings */
.deco-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(56, 189, 248, 0.08);
  pointer-events: none;
}

.deco-ring-1 {
  width: 500px;
  height: 500px;
  top: -180px;
  left: -150px;
}

.deco-ring-2 {
  width: 360px;
  height: 360px;
  bottom: -120px;
  left: 30%;
  border-color: rgba(56, 189, 248, 0.05);
}

/* ── Brand content ────────────────────────────────────────── */
.left-content {
  position: relative;
  z-index: 2;
  padding: 3.5rem 3rem 3.5rem 4rem;
  max-width: 440px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}

.logo-box {
  width: 46px;
  height: 46px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  padding: 9px;
  flex-shrink: 0;
}

.logo-box svg {
  width: 100%;
  height: 100%;
}

.logo-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.05rem;
  font-weight: 500;
  color: #38bdf8;
  letter-spacing: 0.06em;
}

.brand-heading {
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.05em;
}

.line1,
.line2 {
  display: block;
  font-size: clamp(2.6rem, 4vw, 3.8rem);
  font-weight: 700;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.line2 {
  color: #38bdf8;
}

.brand-sub {
  font-size: 0.88rem;
  color: rgba(148, 163, 184, 0.85);
  margin: 0 0 2.25rem;
  line-height: 1.65;
}

.feature-list {
  list-style: none;
  margin: 0 0 2rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.85);
}

.fdot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.9);
}

.badge-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: rgba(56, 189, 248, 0.8);
  letter-spacing: 0.04em;
}

.badge-live {
  border-color: rgba(74, 222, 128, 0.4);
  color: rgba(74, 222, 128, 0.9);
}

/* ─── Right panel ─────────────────────────────────────────── */
.right-panel {
  flex: 1;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  opacity: 0;
  transform: translateX(24px);
  transition: opacity 0.9s ease 0.25s, transform 0.9s ease 0.25s;
}

.right-panel.visible {
  opacity: 1;
  transform: translateX(0);
}

/* ─── Login card ──────────────────────────────────────────── */
.login-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.09),
    0 40px 80px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* Card top */
.card-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem 2.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.card-icon-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7dd3fc;
  padding: 11px;
}

.card-icon-wrap svg {
  width: 100%;
  height: 100%;
}

.card-title {
  font-size: 1.55rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem;
  letter-spacing: -0.03em;
}

.card-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

/* Card body */
.card-body {
  padding: 1.75rem 2.25rem 2rem;
}

/* SSO button */
.sso-btn {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.875rem 1.125rem;
  background: #0f172a;
  color: #ffffff;
  border-radius: 13px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;
}

.sso-btn:hover {
  background: #1e3a5f;
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.32);
}

.sso-btn:active {
  transform: translateY(0);
}

.sso-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg,
      transparent 30%,
      rgba(255, 255, 255, 0.07) 50%,
      transparent 70%);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% center;
  }

  100% {
    background-position: -200% center;
  }
}

.sso-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  position: relative;
  z-index: 1;
}

.sso-icon svg {
  width: 100%;
  height: 100%;
}

.sso-label {
  flex: 1;
  position: relative;
  z-index: 1;
}

.sso-arrow {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  opacity: 0.5;
  position: relative;
  z-index: 1;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.sso-arrow svg {
  width: 100%;
  height: 100%;
}

.sso-btn:hover .sso-arrow {
  transform: translateX(4px);
  opacity: 1;
}

/* Separator */
.sep {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin: 1.5rem 0;
  font-size: 0.78rem;
  color: #94a3b8;
}

.sep-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

/* Forgot password box */
.forgot-box {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.forgot-box:hover {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.forgot-icon-wrap {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0ea5e9;
  padding: 7px;
  margin-top: 1px;
}

.forgot-icon-wrap svg {
  width: 100%;
  height: 100%;
}

.forgot-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.forgot-label {
  font-size: 0.825rem;
  color: #475569;
  font-weight: 500;
}

.forgot-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0ea5e9;
  text-decoration: none;
  transition: color 0.15s ease, gap 0.15s ease;
}

.forgot-link:hover {
  color: #0284c7;
  gap: 0.55rem;
}

.ext-icon {
  width: 12px;
  height: 12px;
  transition: transform 0.15s ease;
  flex-shrink: 0;
}

.forgot-link:hover .ext-icon {
  transform: translate(2px, -2px);
}

/* Card footer */
.card-footer {
  padding: 0.9rem 2.25rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

/* ─── Responsive ──────────────────────────────────────────── */
@media (max-width: 900px) {
  .left-panel {
    flex: 0 0 48%;
  }

  .left-content {
    padding: 2.5rem 2rem 2.5rem 2.5rem;
  }
}

@media (max-width: 680px) {
  .login-root {
    flex-direction: column;
  }

  .left-panel {
    flex: 0 0 auto;
    min-height: 220px;
    align-items: flex-end;
    padding-bottom: 1.5rem;
    transform: translateY(-16px);
    transition: opacity 0.9s ease, transform 0.9s ease;
  }

  .left-panel.visible {
    transform: translateY(0);
  }

  .left-content {
    padding: 1.75rem 1.5rem;
  }

  .line1,
  .line2 {
    font-size: 2.2rem;
  }

  .brand-sub,
  .feature-list,
  .badge-row {
    display: none;
  }

  .room-shapes {
    display: none;
  }

  .deco-ring {
    display: none;
  }

  .right-panel {
    flex: 1;
    background: #f1f5f9;
    transform: translateY(16px);
    transition: opacity 0.9s ease 0.25s, transform 0.9s ease 0.25s;
  }

  .right-panel.visible {
    transform: translateY(0);
  }

  .login-card {
    border-radius: 18px;
  }
}
</style>
