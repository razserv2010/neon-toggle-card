/* neon-toggle-card.js v1.1.0 */
(() => {
  const CARD_TAG = "neon-toggle-card";
  if (customElements.get(CARD_TAG)) {
    console.info(`[NeonToggleCard] ${CARD_TAG} already defined`);
    return;
  }

  class NeonToggleCard extends HTMLElement {
    static getStubConfig() { return { entity: "switch.example" }; }

    setConfig(config) {
      if (!config || !config.entity) throw new Error("חובה להגדיר entity");
      this._config = {
        // טקסטים/צבעים
        name_on:  config.name_on  ?? "ON",
        name_off: config.name_off ?? "OFF",
        on_color: config.on_color ?? "#39FF14",
        off_color:config.off_color?? "#B0B0B0",
        text_on:  config.text_on  ?? "#FFFFFF",
        text_off: config.text_off ?? "#FF3B3B",
        glow_color: config.glow_color ?? "#00D9FF",
        // מראה בסיסי
        height:   config.height   ?? 80,
        width:    config.width    ?? 200,
        radius:   config.radius   ?? 9999,
        shadow_intensity: config.shadow_intensity ?? 0.6,
        animate:  config.animate  ?? true,
        tap_action: config.tap_action ?? "toggle",
        // חדש: ריווח ומיקום
        padding_v: config.padding_v ?? 0,     // px
        padding_h: config.padding_h ?? 0,     // px
        justify:   config.justify   ?? "space-between", // left/center/right/space-between
        align:     config.align     ?? "center",        // top/center/bottom
        gap:       config.gap       ?? 16,              // px
        // entity
        entity:   config.entity,
      };

      this._root = this.attachShadow({ mode: "open" });
      this._renderSkeleton();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._config) return;

      const stateObj = hass.states?.[this._config.entity];
      if (!stateObj) { this._setUnavailable(); return; }

      const isOn = stateObj.state === "on";
      this._label.textContent = isOn ? this._config.name_on : this._config.name_off;
      this._label.style.color = isOn ? this._config.text_on : this._config.text_off;
      this._circle.style.background = isOn ? this._config.on_color : this._config.off_color;
      this._circle.style.boxShadow = isOn
        ? `0 0 20px 5px ${this._config.on_color}`
        : `0 0 12px 3px ${this._config.off_color}AA`;

      this._card.style.boxShadow =
        `0 0 18px 3px ${this._config.glow_color}${this._alpha(this._config.shadow_intensity)}, inset 0 0 0 1px ${this._rgba(this._config.glow_color,0.35)}`;

      this._card.setAttribute("aria-pressed", String(isOn));
      this._card.dataset.state = isOn ? "on" : "off";
    }

    getCardSize() { return 2; }

    // --- helpers ---
    _alpha(a){ return Math.round(a*255).toString(16).padStart(2,"0"); }
    _rgba(hex, a=1){
      const m = hex.replace("#","").match(/^([0-9a-f]{6})$/i);
      if(!m) return hex;
      const r = parseInt(m[1].slice(0,2),16),
            g = parseInt(m[1].slice(2,4),16),
            b = parseInt(m[1].slice(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    }
    _mapJustify(val){
      const map = { left:"flex-start", center:"center", right:"flex-end", "space-between":"space-between" };
      return map[val] ?? "space-between";
    }
    _mapAlign(val){
      const map = { top:"flex-start", center:"center", bottom:"flex-end" };
      return map[val] ?? "center";
    }

    _renderSkeleton() {
      const s = document.createElement("style");
      s.textContent = `
        :host { display:block; }
        .wrap {
          position: relative;
          background: var(--ha-card-background, #000); /* נראה נקי ליד כרטיסים אחרים */
          background: #000; /* ברירת מחדל: שחור ניאון */
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 26px;
          user-select: none;
          cursor: pointer;
          transition: transform .08s ease;
          outline: none;
          gap: 16px;
        }
        .wrap:active { transform: scale(0.98); }
        .label {
          font-family: 'Rubik', Inter, system-ui, sans-serif;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-shadow: 0 0 10px rgba(255,255,255,.65);
          filter: drop-shadow(0 0 2px rgba(255,255,255,.25));
        }
        .circle {
          height: 40px; width: 40px; border-radius: 9999px;
          transition: all .25s ease;
        }
        .wrap[data-state="on"] .circle { transform: scale(1.04); }
        .wrap[data-state="off"] .circle { transform: scale(0.98); }
        .breath[data-state="on"] { animation: breathOn 2.1s ease-in-out infinite; }
        .breath[data-state="off"]{ animation: breathOff 2.4s ease-in-out infinite; }
        @keyframes breathOn  { 0%,100%{ box-shadow: 0 0 18px 3px var(--glow) } 50%{ box-shadow: 0 0 26px 6px var(--glow) } }
        @keyframes breathOff { 0%,100%{ box-shadow: 0 0 10px 2px var(--glowOff) } 50%{ box-shadow: 0 0 14px 3px var(--glowOff) } }
        .wrap.unavail { opacity: .5; filter: grayscale(0.6); cursor: not-allowed; }
      `;
      this._root.appendChild(s);

      this._card = document.createElement("div");
      this._card.className = "wrap";
      this._card.style.height = this._config.height + "px";
      this._card.style.width  = this._config.width  + "px";
      this._card.style.borderRadius = this._config.radius + "px";
      this._card.style.setProperty("--glow", this._rgba(this._config.glow_color,0.9));
      this._card.style.setProperty("--glowOff", "rgba(176,176,176,.6)");

      // חדש: ריווח/מיקום/מרווח פנימי
      this._card.style.padding = `${this._config.padding_v}px ${this._config.padding_h}px`;
      this._card.style.justifyContent = this._mapJustify(this._config.justify);
      this._card.style.alignItems = this._mapAlign(this._config.align);
      this._card.style.gap = `${this._config.gap}px`;

      this._label = document.createElement("div");
      this._label.className = "label";
      this._label.style.fontSize = Math.round(this._config.height*0.36) + "px";

      this._circle = document.createElement("div");
      this._circle.className = "circle";

      if (this._config.animate) this._card.classList.add("breath");

      this._card.tabIndex = 0;
      this._card.role = "button";
      this._card.addEventListener("click", () => this._handleTap());
      this._card.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); this._handleTap(); }
      });

      // ברירת מחדל: label ואז circle (כמו בתמונה שלך)
      this._card.appendChild(this._label);
      this._card.appendChild(this._circle);
      this._root.appendChild(this._card);
    }

    _handleTap() {
      if (!this._hass || !this._config) return;
      const st = this._hass.states?.[this._config.entity];
      if (!st) return;

      const [domain] = this._config.entity.split(".");
      let service = "toggle";
      if (this._config.tap_action === "on") service = "turn_on";
      if (this._config.tap_action === "off") service = "turn_off";

      this._hass.callService(domain, service, { entity_id: this._config.entity });
      this._card.animate([{transform:"scale(1)"},{transform:"scale(.97)"},{transform:"scale(1)"}],
                         {duration:130, easing:"ease-out"});
    }

    _setUnavailable() {
      if (!this._card) return;
      this._label.textContent = "UNAVAILABLE";
      this._label.style.color = "#888";
      this._circle.style.background = "#666";
      this._circle.style.boxShadow = "none";
      this._card.classList.add("unavail");
    }
  }

  customElements.define(CARD_TAG, NeonToggleCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_TAG,
    name: "Neon Toggle Card",
    description: "טוגל ניאון עם ON/OFF, שליטה בריווח ומיקום.",
  });
  window.NEON_TOGGLE_CARD_LOADED = "1.1.0";
  console.info(`%c Neon Toggle Card %c v1.1.0 `,
    "background:#00d9ff;color:#000;padding:2px 6px;border-radius:4px",
    "background:#222;color:#fff;padding:2px 6px;border-radius:4px");
})();
