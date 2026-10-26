// ============================================================================
// CBT UI Helpers, Tablet Touch Controls & Modals
// ============================================================================
(function() {
  const UI = {
    fontScale: 1.0,
    isSplitLayout: false,
    isOmrDrawerOpen: false,

    init: function() {
      this.bindTouchGestures();
      this.bindWindowResize();
    },

    setFontScale: function(scale, btnId) {
      this.fontScale = scale;
      document.documentElement.style.setProperty("--font-scale", scale);
      ["zoom85", "zoom100", "zoom115"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("active", id === btnId);
      });
    },

    setLayoutMode: function(isSplit) {
      this.isSplitLayout = isSplit;
      const inner = document.getElementById("paperInner");
      if (inner) inner.classList.toggle("split-mode", isSplit);

      const btnSingle = document.getElementById("layoutSingle");
      const btnSplit = document.getElementById("layoutSplit");
      if (btnSingle) btnSingle.classList.toggle("active", !isSplit);
      if (btnSplit) btnSplit.classList.toggle("active", isSplit);
    },

    toggleOmrDrawer: function(forceState) {
      const omrPane = document.querySelector(".omr-pane");
      const overlay = document.getElementById("omrDrawerOverlay");
      const floatingBtn = document.getElementById("btnFloatingOmr");

      if (typeof forceState === "boolean") {
        this.isOmrDrawerOpen = forceState;
      } else {
        this.isOmrDrawerOpen = !this.isOmrDrawerOpen;
      }

      if (omrPane) omrPane.classList.toggle("drawer-open", this.isOmrDrawerOpen);
      if (overlay) overlay.classList.toggle("active", this.isOmrDrawerOpen);
      if (floatingBtn) {
        floatingBtn.innerHTML = this.isOmrDrawerOpen
          ? `✕ 닫기`
          : `📋 OMR 답안지 (${window.App ? window.App.getAnsweredCount() : 0}/75)`;
      }
    },

    // Touch Swipe Gestures for Tablets & Mobile
    bindTouchGestures: function() {
      const paperPane = document.querySelector(".paper-pane");
      if (!paperPane) return;

      let touchStartX = 0;
      let touchStartY = 0;
      let touchEndX = 0;
      let touchEndY = 0;

      paperPane.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      paperPane.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        this.handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY);
      }, { passive: true });
    },

    handleSwipeGesture: function(startX, startY, endX, endY) {
      const diffX = endX - startX;
      const diffY = endY - startY;
      // Minimum swipe distance 60px, horizontal dominant
      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX < 0) {
          // Swiped left -> Next Question
          if (window.App) window.App.moveQuestion(1);
        } else {
          // Swiped right -> Previous Question
          if (window.App) window.App.moveQuestion(-1);
        }
      }
    },

    bindWindowResize: function() {
      window.addEventListener("resize", () => {
        if (window.innerWidth >= 1024 && this.isOmrDrawerOpen) {
          this.toggleOmrDrawer(false);
        }
      });
    },

    // History Modal Management
    showHistoryModal: function() {
      const modal = document.getElementById("historyModal");
      const listEl = document.getElementById("historyListContainer");
      if (!modal || !listEl) return;

      const history = window.StorageManager.getAllHistory();
      if (history.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center; padding:36px; color:#64748b;">
            <div style="font-size:2rem; margin-bottom:8px;">📂</div>
            <p>저장된 이전 응시 기록이 없습니다.</p>
            <p style="font-size:0.85rem; margin-top:4px;">시험을 응시하고 답안을 제출하면 성적과 오답 분석이 이곳에 자동 저장됩니다.</p>
          </div>
        `;
      } else {
        let rows = "";
        history.forEach((rec, idx) => {
          const passBadge = rec.scores.isPass
            ? `<span style="color:#16a34a; font-weight:800;">합격</span>`
            : `<span style="color:#dc2626; font-weight:800;">불합격</span>`;

          const m = String(Math.floor(rec.timeSpentSeconds / 60)).padStart(2, "0");
          const s = String(rec.timeSpentSeconds % 60).padStart(2, "0");

          rows += `
            <tr>
              <td><strong>${rec.roundTitle}</strong></td>
              <td>${rec.formattedDate}</td>
              <td>${rec.scores.s1}점 / ${rec.scores.s2}점 / ${rec.scores.s3}점</td>
              <td><strong>${rec.scores.totalAvg}점</strong></td>
              <td>${passBadge}</td>
              <td>${m}:${s}</td>
              <td>
                <button class="cbt-btn" style="padding:4px 8px; font-size:0.78rem;" onclick="App.loadPastResult('${rec.id}')">결과 보기</button>
                <button class="cbt-btn" style="padding:4px 8px; font-size:0.78rem; color:#dc2626;" onclick="App.deleteHistoryItem('${rec.id}')">삭제</button>
              </td>
            </tr>
          `;
        });

        listEl.innerHTML = `
          <table class="history-table">
            <thead>
              <tr>
                <th>응시 회차</th>
                <th>응시 일시</th>
                <th>과목별 점수 (1/2/3과목)</th>
                <th>평균</th>
                <th>판정</th>
                <th>소요시간</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="display:flex; justify-content:flex-end; margin-top:14px;">
            <button class="cbt-btn" style="color:#dc2626;" onclick="App.clearAllHistoryPrompt()">전체 기록 삭제</button>
          </div>
        `;
      }

      modal.style.display = "flex";
    },

    closeHistoryModal: function() {
      const modal = document.getElementById("historyModal");
      if (modal) modal.style.display = "none";
    }
  };

  if (typeof window !== 'undefined') {
    window.UI = UI;
  }
})();
