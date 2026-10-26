// ============================================================================
// 대한상공회의소 무역영어 1급 기출문제 CBT 공식 시험 엔진 (제111회 ~ 제119회)
// ============================================================================
(function() {
  const CIRCLE_NUMS = ["①", "②", "③", "④"];

  const App = {
    manifest: [],
    currentRound: 111,
    currentExamData: [],
    curIdx: 0,
    answers: Array(75).fill(null),
    flags: Array(75).fill(false),
    timeLeft: 90 * 60, // 90분 = 5400초
    timerHandle: null,
    omrFilter: "all",
    startTime: null,
    currentRecordId: null,

    getExamData: function(round) {
      if (window.CBT_EXAMS && window.CBT_EXAMS[round]) return window.CBT_EXAMS[round];
      if (window["EXAM_" + round]) return window["EXAM_" + round];
      return null;
    },

    init: function() {
      // CBT_EXAMS 맵 자동 바인딩 (제111회 ~ 제119회)
      window.CBT_EXAMS = window.CBT_EXAMS || {};
      for (let r = 111; r <= 119; r++) {
        if (window["EXAM_" + r]) {
          window.CBT_EXAMS[r] = window["EXAM_" + r];
        }
      }

      this.manifest = window.CBT_EXAM_MANIFEST || [];
      this.populateRoundSelector();
      this.bindKeyboardShortcuts();

      // UI Touch & Resize Initializer
      if (window.UI) {
        window.UI.init();
      }
    },

    // 1. 대기실(로비) 회차 선택 드롭다운 채우기
    populateRoundSelector: function() {
      const selectEl = document.getElementById("examRoundSelect");
      if (!selectEl) return;

      selectEl.innerHTML = "";
      this.manifest.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.round;
        opt.textContent = `${item.title} (${item.yearLabel})${item.hasExplanations ? " - 상세 해설 포함" : " - 공식 정답 탑재"}`;
        if (item.round === 111) opt.selected = true;
        selectEl.appendChild(opt);
      });

      this.onSelectRound(111);
    },

    // 회차 선택 변경 시 대기실 정보 업데이트
    onSelectRound: function(round) {
      const rNum = parseInt(round, 10);
      this.currentRound = rNum;
      const meta = this.manifest.find(m => m.round === rNum) || {
        round: rNum,
        title: `무역영어 1급 제${rNum}회`,
        yearLabel: `제${rNum}회 기출`,
        description: "대한상공회의소 무역영어 1급 공식 기출문제"
      };

      const titleEl = document.getElementById("lobbyRoundTitle");
      if (titleEl) titleEl.textContent = `${meta.title} (${meta.yearLabel})`;

      const descEl = document.getElementById("lobbyRoundDesc");
      if (descEl) descEl.textContent = meta.description;

      const numEl = document.getElementById("candidateExamNum");
      if (numEl) numEl.textContent = `2020-${meta.round}-00101`;
    },

    // 2. 시험 시작 (대기실 숨김 및 타이머 작동)
    startOfficialExam: function() {
      const chk = document.getElementById("agreeChk");
      if (!chk || !chk.checked) {
        alert("응시자 유의사항을 확인하고 동의란에 체크해 주세요.");
        return;
      }

      const selectEl = document.getElementById("examRoundSelect");
      if (selectEl) {
        this.currentRound = parseInt(selectEl.value, 10);
      }

      // 회차 데이터 유효성 검증
      this.currentExamData = this.getExamData(this.currentRound);
      if (!this.currentExamData || this.currentExamData.length !== 75) {
        alert(`제${this.currentRound}회 기출시험 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.`);
        return;
      }

      // 상태 초기화
      this.curIdx = 0;
      this.answers = Array(75).fill(null);
      this.flags = Array(75).fill(false);
      this.timeLeft = 90 * 60;
      this.startTime = Date.now();
      this.currentRecordId = null;

      // 상단 헤더 회차 라벨 반영
      const headerTitle = document.getElementById("examHeaderTitle");
      if (headerTitle) {
        headerTitle.textContent = `대한상공회의소 무역영어 1급 (제${this.currentRound}회 A형)`;
      }

      // 대기실 닫기
      const lobby = document.getElementById("lobbyScreen");
      if (lobby) lobby.style.display = "none";

      // 타이머 시작
      this.startTimer();

      // 첫 문항 렌더링
      this.renderExamScreen();
    },

    // 3. 타이머 제어
    startTimer: function() {
      if (this.timerHandle) clearInterval(this.timerHandle);
      this.updateTimerDisplay();

      this.timerHandle = setInterval(() => {
        this.timeLeft--;
        this.updateTimerDisplay();

        if (this.timeLeft <= 0) {
          clearInterval(this.timerHandle);
          alert("시험 종료 시간(90분)이 만료되었습니다.\n작성한 답안이 자동으로 제출됩니다.");
          this.submitOfficialExam(true);
        }
      }, 1000);
    },

    updateTimerDisplay: function() {
      const timerEl = document.getElementById("countdownDisplay");
      if (!timerEl) return;

      const m = Math.floor(this.timeLeft / 60);
      const s = this.timeLeft % 60;
      timerEl.textContent = `남은시간 ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

      // 종료 10분 전부터 붉은색 경고 점멸
      timerEl.classList.toggle("warning", this.timeLeft <= 600);
    },

    getSubTitle: function(sub) {
      if (sub === 1) return "제1과목 영문해석";
      if (sub === 2) return "제2과목 영작문";
      return "제3과목 무역실무";
    },

    // 4. 문항 화면 렌더링 (지문 HTML, 밑줄 <u>, 빈칸, 선택지)
    renderExamScreen: function() {
      if (!this.currentExamData || this.currentExamData.length === 0) return;

      const q = this.currentExamData[this.curIdx];
      if (!q) return;

      // 문제 헤더 타이틀 (과목명 - 문항 번호)
      const qHeaderTitle = document.getElementById("qHeaderTitle");
      if (qHeaderTitle) {
        qHeaderTitle.textContent = `${this.getSubTitle(q.subject)} - 문항 ${String(q.id).padStart(2, "0")}`;
      }

      // 상단 과목 탭 활성화
      ["subTab1", "subTab2", "subTab3"].forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("active", q.subject === (i + 1));
      });

      // 다시 보기 플래그 버튼
      const flagBtn = document.getElementById("btnFlag");
      if (flagBtn) {
        const isFlagged = this.flags[this.curIdx];
        flagBtn.classList.toggle("flagged", isFlagged);
        flagBtn.textContent = isFlagged ? "★ 다시 보기 체크됨" : "☆ 다시 보기 체크";
      }

      // 지문 영역 (밑줄 <u>, <span class="blank-line"> 등 HTML 완전 보존)
      const pBox = document.getElementById("qPassageBox");
      if (pBox) {
        pBox.classList.toggle("formatted-question", !!q.formatVersion);
        if (q.passage && q.passage.trim() !== "") {
          pBox.style.display = "block";
          pBox.innerHTML = q.passage;
        } else {
          pBox.style.display = "none";
          pBox.innerHTML = "";
        }
      }

      // 문제 발문 (innerHTML 적용하여 심볼 및 강조 표현 보존)
      const stemBox = document.getElementById("qStemBox");
      if (stemBox) {
        stemBox.classList.toggle("formatted-question", !!q.formatVersion);
        stemBox.innerHTML = q.stem;
      }

      // 4지선다 보기 영역
      const choicesBox = document.getElementById("qChoicesBox");
      if (choicesBox) {
        choicesBox.classList.toggle("formatted-question", !!q.formatVersion);
        choicesBox.innerHTML = "";
        q.options.forEach((opt, idx) => {
          const row = document.createElement("div");
          row.className = "choice-row" + (this.answers[this.curIdx] === idx ? " selected" : "");
          row.onclick = () => this.markAnswer(this.curIdx, idx);
          row.innerHTML = `<span class="choice-circle">${idx + 1}</span><span>${opt}</span>`;
          choicesBox.appendChild(row);
        });
      }

      // 하단 이전/다음 버튼 비활성화 상태
      const btnPrev = document.getElementById("btnPrevQ");
      const btnNext = document.getElementById("btnNextQ");
      if (btnPrev) btnPrev.disabled = (this.curIdx === 0);
      if (btnNext) btnNext.disabled = (this.curIdx === this.currentExamData.length - 1);

      // 응시 현황 통계 바 업데이트
      const answeredCnt = this.getAnsweredCount();
      const flaggedCnt = this.flags.filter(Boolean).length;
      const progressStat = document.getElementById("progressStat");
      if (progressStat) {
        progressStat.textContent = `총 75문항 중 ${answeredCnt}문항 표기 | 미표기 ${75 - answeredCnt}문항 | ★체크 ${flaggedCnt}문항`;
      }

      // OMR 패널 갱신
      this.renderOmrPanel();

      // 태블릿 플로팅 OMR 버튼 텍스트 업데이트
      const floatBtn = document.getElementById("btnFloatingOmr");
      if (floatBtn && !window.UI.isOmrDrawerOpen) {
        floatBtn.innerHTML = `📋 OMR 답안지 (${answeredCnt}/75)`;
      }
    },

    getAnsweredCount: function() {
      return this.answers.filter(a => a !== null).length;
    },

    // 5. 답안 마킹 처리
    markAnswer: function(qIdx, optIdx) {
      this.answers[qIdx] = optIdx;
      this.curIdx = qIdx;
      this.renderExamScreen();
    },

    // 6. 다시 보기 플래그 토글
    toggleFlagCurrent: function() {
      this.flags[this.curIdx] = !this.flags[this.curIdx];
      this.renderExamScreen();
    },

    // 7. 문항 이동
    moveQuestion: function(delta) {
      const next = this.curIdx + delta;
      if (next >= 0 && next < this.currentExamData.length) {
        this.curIdx = next;
        this.renderExamScreen();
      }
    },

    jumpToQuestion: function(idx) {
      if (idx >= 0 && idx < this.currentExamData.length) {
        this.curIdx = idx;
        this.renderExamScreen();
        // 태블릿에서 OMR 드로어가 열려있다면 이동 후 자동으로 닫기
        if (window.UI && window.UI.isOmrDrawerOpen) {
          window.UI.toggleOmrDrawer(false);
        }
      }
    },

    // 8. OMR 필터 (전체, 미표기, 체크)
    setOmrFilter: function(mode) {
      this.omrFilter = mode;
      ["omrFilterAll", "omrFilterUnanswered", "omrFilterFlagged"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("active", id.toLowerCase().includes(mode));
      });
      this.renderOmrPanel();
    },

    // 9. OMR 답안지 렌더링
    renderOmrPanel: function() {
      const container = document.getElementById("omrListContainer");
      if (!container || !this.currentExamData) return;

      container.innerHTML = "";

      this.currentExamData.forEach((q, idx) => {
        if (this.omrFilter === "unanswered" && this.answers[idx] !== null) return;
        if (this.omrFilter === "flagged" && !this.flags[idx]) return;

        const row = document.createElement("div");
        row.className = "omr-row" + (idx === this.curIdx ? " current" : "");
        row.onclick = () => this.jumpToQuestion(idx);

        const numSpan = document.createElement("div");
        numSpan.className = "omr-qnum";
        numSpan.innerHTML = `<span>${String(q.id).padStart(2, "0")}번</span>${this.flags[idx] ? '<span style="color:#d97706;">★</span>' : ''}`;

        const bubblesDiv = document.createElement("div");
        bubblesDiv.className = "omr-bubbles";
        for (let b = 0; b < 4; b++) {
          const bub = document.createElement("span");
          bub.className = "omr-bubble" + (this.answers[idx] === b ? " marked" : "");
          bub.textContent = b + 1;
          bub.onclick = (e) => {
            e.stopPropagation();
            this.markAnswer(idx, b);
          };
          bubblesDiv.appendChild(bub);
        }

        row.appendChild(numSpan);
        row.appendChild(bubblesDiv);
        container.appendChild(row);
      });
    },

    // 10. 시험 답안 최종 제출 및 채점
    submitOfficialExam: function(auto = false) {
      const unanswered = 75 - this.getAnsweredCount();
      if (!auto) {
        const msg = unanswered > 0
          ? `아직 표기하지 않은 문항이 ${unanswered}개 있습니다.\n답안을 최종 제출하고 시험을 종료하시겠습니까?`
          : `모든 문항의 답안을 표기하셨습니다.\n답안을 최종 제출하고 시험을 종료하시겠습니까?`;
        if (!confirm(msg)) return;
      }

      if (this.timerHandle) clearInterval(this.timerHandle);

      // 과목별 점수 산출 (25문항 * 4점 = 100점 만점)
      let s1 = 0, s2 = 0, s3 = 0;
      let correctCnt = 0;
      const wrongList = [];

      this.currentExamData.forEach((q, i) => {
        const isOk = this.isCorrectAnswer(q, this.answers[i]);
        if (isOk) {
          correctCnt++;
          if (q.subject === 1) s1 += 4;
          if (q.subject === 2) s2 += 4;
          if (q.subject === 3) s3 += 4;
        } else {
          wrongList.push({
            id: q.id,
            subject: q.subject,
            userChoice: this.answers[i],
            correctChoice: q.answer
          });
        }
      });

      const totalAvg = parseFloat(((s1 + s2 + s3) / 3).toFixed(1));
      const isPass = (s1 >= 40 && s2 >= 40 && s3 >= 40 && totalAvg >= 60.0);
      const timeSpentSeconds = Math.max(0, (90 * 60) - this.timeLeft);

      const meta = this.manifest.find(m => m.round === this.currentRound) || {
        title: `무역영어 1급 제${this.currentRound}회`,
        yearLabel: `기출`
      };

      // 시험 결과 저장소(StorageManager)에 저장
      const savedRecord = window.StorageManager.saveExamResult({
        round: this.currentRound,
        roundTitle: meta.title,
        yearLabel: meta.yearLabel,
        timeSpentSeconds: timeSpentSeconds,
        scores: {
          s1: s1,
          s2: s2,
          s3: s3,
          totalAvg: totalAvg,
          isPass: isPass
        },
        answeredCount: this.getAnsweredCount(),
        correctCount: correctCnt,
        answers: [...this.answers],
        flags: [...this.flags],
        wrongQuestions: wrongList
      });

      if (savedRecord) {
        this.currentRecordId = savedRecord.id;
      }

      // 성적표 테이블 렌더링
      const scoreTable = document.getElementById("scoreTable");
      if (scoreTable) {
        scoreTable.innerHTML = `
          <tr>
            <th>제1과목 (영문해석)</th>
            <th>제2과목 (영작문)</th>
            <th>제3과목 (무역실무)</th>
            <th>평균 점수</th>
            <th>최종 합격 판정</th>
          </tr>
          <tr>
            <td><strong>${s1}점</strong> (${s1 / 4}/25)</td>
            <td><strong>${s2}점</strong> (${s2 / 4}/25)</td>
            <td><strong>${s3}점</strong> (${s3 / 4}/25)</td>
            <td><strong>${totalAvg}점</strong></td>
            <td style="color:${isPass ? '#16a34a' : '#dc2626'}; font-weight:800; font-size:1.05rem;">
              ${isPass ? '합격 (PASS)' : '불합격 (과락 40점 미만 또는 평균 60점 미만)'}
            </td>
          </tr>
        `;
      }

      // 리뷰 화면 회차 라벨
      const reviewHeader = document.getElementById("reviewHeaderRoundTitle");
      if (reviewHeader) {
        reviewHeader.textContent = `${meta.title} (${meta.yearLabel}) 채점 결과 및 공식 해설`;
      }

      // 결과 화면 열기
      const reviewScreen = document.getElementById("reviewScreen");
      if (reviewScreen) {
        reviewScreen.style.display = "block";
      }

      // 기본적으로 전 문항 해설 카드 표시
      this.filterSolutions("all");
    },

    // 11. 시험 종료 후 정답 및 해설 카드 렌더링
    filterSolutions: function(mode) {
      const box = document.getElementById("solutionsContainer");
      if (!box || !this.currentExamData) return;

      if (this.ensureOriginalExplanationsLoaded(mode)) return;

      box.innerHTML = "";

      this.currentExamData.forEach((q, idx) => {
        const uAns = this.answers[idx];
        const isOk = this.isCorrectAnswer(q, uAns);
        if (mode === "wrong" && isOk) return;

        const card = document.createElement("div");
        card.className = "sol-card " + (isOk ? "correct" : "wrong") + (q.formatVersion ? " formatted-question" : "");

        const uText = uAns !== null ? `${CIRCLE_NUMS[uAns]} ${q.options[uAns]}` : "미표기 (미답안)";
        const cText = this.correctAnswerIndices(q).map(answer => `${CIRCLE_NUMS[answer]} ${q.options[answer]}`).join(" 또는 ");

        // 원문 스캔 해설과 기존 텍스트 해설 렌더링
        let explanationHtml = "";
        if (q.explanationSource) {
          explanationHtml = this.renderOriginalExplanation(q);
        } else if (q.explanation && q.explanation.trim() !== "") {
          explanationHtml = `<div class="pdf-sol-block">${q.explanation}</div>`;
        } else {
          explanationHtml = `<div class="pdf-sol-block" style="color:#64748b;">[공식 정답 탑재] 정답: ${cText} (상세 해설은 추후 보강 예정입니다.)</div>`;
        }

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
            <span>[${this.getSubTitle(q.subject)}] ${q.stem}</span>
            <span style="color:${isOk ? '#16a34a' : '#dc2626'}; font-size:1.02rem;">${isOk ? '정답 (O)' : '오답 (X)'}</span>
          </div>
          ${q.passage ? `<div class="passage-container" style="margin-bottom:12px;">${q.passage}</div>` : ""}
          <div style="font-size:0.92rem; margin-bottom:10px; background:#f1f5f9; padding:8px 12px; border-radius:3px;">
            <strong style="color:#334155;">수험자 마킹:</strong> ${uText} &nbsp;|&nbsp;
            <strong style="color:var(--kcci-blue);">공식 정답:</strong> ${cText}
          </div>
          ${explanationHtml}
        `;
        box.appendChild(card);
      });
    },

    // 12. 이전 응시 기록 불러와서 리뷰 화면 띄우기
    loadPastResult: function(recordId) {
      const rec = window.StorageManager.getRecordById(recordId);
      if (!rec) {
        alert("해당 응시 기록을 찾을 수 없습니다.");
        return;
      }

      this.currentRound = rec.round;
      this.currentExamData = this.getExamData(rec.round);
      this.answers = rec.answers;
      this.flags = rec.flags;

      // Re-evaluate restored reviews against confirmed multiple-answer items.
      // The saved attempt itself remains unchanged.
      if (this.currentExamData.some(q => Array.isArray(q.acceptedAnswers))) {
        const subjectScores = [0, 0, 0];
        this.currentExamData.forEach((q, index) => {
          if (this.isCorrectAnswer(q, this.answers[index])) subjectScores[q.subject - 1] += 4;
        });
        rec.scores = {
          s1: subjectScores[0], s2: subjectScores[1], s3: subjectScores[2],
          totalAvg: Number((subjectScores.reduce((a, b) => a + b, 0) / 3).toFixed(1)),
          isPass: subjectScores.every(score => score >= 40) && subjectScores.reduce((a, b) => a + b, 0) / 3 >= 60
        };
      }

      // 기록 모달 닫기
      if (window.UI) window.UI.closeHistoryModal();

      // 대기실 닫기
      const lobby = document.getElementById("lobbyScreen");
      if (lobby) lobby.style.display = "none";

      // 성적표 테이블 렌더링
      const scoreTable = document.getElementById("scoreTable");
      if (scoreTable) {
        scoreTable.innerHTML = `
          <tr>
            <th>제1과목 (영문해석)</th>
            <th>제2과목 (영작문)</th>
            <th>제3과목 (무역실무)</th>
            <th>평균 점수</th>
            <th>최종 합격 판정</th>
          </tr>
          <tr>
            <td><strong>${rec.scores.s1}점</strong> (${rec.scores.s1 / 4}/25)</td>
            <td><strong>${rec.scores.s2}점</strong> (${rec.scores.s2 / 4}/25)</td>
            <td><strong>${rec.scores.s3}점</strong> (${rec.scores.s3 / 4}/25)</td>
            <td><strong>${rec.scores.totalAvg}점</strong></td>
            <td style="color:${rec.scores.isPass ? '#16a34a' : '#dc2626'}; font-weight:800; font-size:1.05rem;">
              ${rec.scores.isPass ? '합격 (PASS)' : '불합격 (과락 40점 미만 또는 평균 60점 미만)'}
            </td>
          </tr>
        `;
      }

      const reviewHeader = document.getElementById("reviewHeaderRoundTitle");
      if (reviewHeader) {
        reviewHeader.textContent = `${rec.roundTitle} (${rec.formattedDate} 응시 기록) 복원 해설지`;
      }

      // 리뷰 화면 열기
      const reviewScreen = document.getElementById("reviewScreen");
      if (reviewScreen) {
        reviewScreen.style.display = "block";
      }

      this.filterSolutions("all");
    },

    deleteHistoryItem: function(recordId) {
      if (confirm("이 응시 기록을 삭제하시겠습니까?")) {
        window.StorageManager.deleteRecord(recordId);
        if (window.UI) window.UI.showHistoryModal();
      }
    },

    clearAllHistoryPrompt: function() {
      if (confirm("저장된 모든 기출시험 응시 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
        window.StorageManager.clearAllHistory();
        if (window.UI) window.UI.showHistoryModal();
      }
    },

    // 13. 시험 다시 응시 / 대기실로 복귀
    restartExam: function() {
      const reviewScreen = document.getElementById("reviewScreen");
      if (reviewScreen) reviewScreen.style.display = "none";

      const lobby = document.getElementById("lobbyScreen");
      if (lobby) lobby.style.display = "flex";

      // 체크박스 리셋
      const chk = document.getElementById("agreeChk");
      if (chk) chk.checked = false;
      const btnStart = document.getElementById("btnStart");
      if (btnStart) btnStart.disabled = true;

      if (this.timerHandle) clearInterval(this.timerHandle);
    },

    // 14. 키보드 단축키
    bindKeyboardShortcuts: function() {
      window.addEventListener("keydown", (e) => {
        const lobby = document.getElementById("lobbyScreen");
        const review = document.getElementById("reviewScreen");
        const historyModal = document.getElementById("historyModal");

        // 모달이나 대기실, 결과 화면이 떠 있는 동안에는 문항 단축키 무시
        if (lobby && lobby.style.display !== "none") return;
        if (review && review.style.display === "block") return;
        if (historyModal && historyModal.style.display === "flex") return;

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.moveQuestion(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.moveQuestion(1);
        } else if (["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          this.markAnswer(this.curIdx, parseInt(e.key, 10) - 1);
        }
      });
    }
  };

  if (typeof window !== "undefined") {
    window.App = App;
  }
})();


// Added textbook explanations: original scans, loaded only for submitted reviews.
(function () {
  const app = window.App;
  app.correctAnswerIndices = function (question) {
    return Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length
      ? question.acceptedAnswers : [question.answer];
  };
  app.isCorrectAnswer = function (question, choice) {
    return Number.isInteger(choice) && this.correctAnswerIndices(question).includes(choice);
  };
  app._originalExplanationLoads = {};
  app._originalExplanationErrors = {};
  app._originalImageUrls = {};

  app.ensureOriginalExplanationsLoaded = function (mode) {
    const round = this.currentRound;
    const needsSource = this.currentExamData.some(q => q.explanationSource);
    if (!needsSource || (window.CBT_EXPLANATION_PAGES && window.CBT_EXPLANATION_PAGES[round]) || this._originalExplanationErrors[round]) return false;
    this._originalExplanationFilter = mode;
    const box = document.getElementById("solutionsContainer");
    if (box) box.innerHTML = '<p class="source-explanation-loading" role="status">교재 원문 해설을 불러오는 중입니다…</p>';
    if (!this._originalExplanationLoads[round]) {
      this._originalExplanationLoads[round] = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `data/explanations/explanations_${Number(round)}.js?v=20261026`;
        script.onload = () => {
          if (window.CBT_EXPLANATION_PAGES && window.CBT_EXPLANATION_PAGES[round]) resolve();
          else reject(new Error("Original explanation data is missing"));
        };
        script.onerror = () => reject(new Error("Original explanation script could not be loaded"));
        document.head.appendChild(script);
      }).then(() => {
        if (this.currentRound === round) this.filterSolutions(this._originalExplanationFilter || "all");
      }).catch(() => {
        this._originalExplanationErrors[round] = true;
        if (this.currentRound === round) this.filterSolutions(this._originalExplanationFilter || "all");
      });
    }
    return true;
  };

  app.getOriginalImageUrl = function (round, page) {
    const key = `${round}:${page}`;
    if (this._originalImageUrls[key]) return this._originalImageUrls[key];
    const meta = window.CBT_EXPLANATION_PAGES?.[round]?.[page];
    if (!meta) return "";
    const comma = meta.src.indexOf(",");
    const mime = meta.src.slice(5, meta.src.indexOf(";"));
    const binary = atob(meta.src.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    this._originalImageUrls[key] = url;
    return url;
  };

  app.originalPageFrame = function (round, page, viewport, label) {
    const meta = window.CBT_EXPLANATION_PAGES?.[round]?.[page];
    if (!meta) return "";
    const [x, y, width, height] = viewport;
    const [ix, iy, iw, ih] = meta.box;
    const ratio = (meta.canvas[0] * width) / (meta.canvas[1] * height);
    return `<div class="source-page-frame" style="aspect-ratio:${ratio}"><img class="source-page-image" src="${this.getOriginalImageUrl(round, page)}" alt="${label}" loading="lazy" decoding="async" style="left:${(ix - x) / width * 100}%;top:${(iy - y) / height * 100}%;width:${iw / width * 100}%;height:${ih / height * 100}%"></div>`;
  };

  app.renderOriginalExplanation = function (question) {
    const source = question.explanationSource;
    const pages = window.CBT_EXPLANATION_PAGES?.[source.round];
    const safeUrl = source.url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    if (!pages) return `<section class="source-explanation"><p>원문 이미지를 불러오지 못했습니다.</p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">교재 원문 PDF 열기</a></section>`;
    const figures = source.fragments.map((fragment, index) => {
      const label = `제${source.round}회 ${question.id}번 교재 원문 해설${index ? " 이어서" : ""}, PDF ${fragment.page}쪽`;
      return `<figure class="source-explanation-fragment">${this.originalPageFrame(source.round, fragment.page, fragment.viewport, label)}<figcaption>PDF ${fragment.page}쪽${index ? " · 이어지는 해설" : ""}</figcaption></figure>`;
    }).join("");
    return `<section class="source-explanation" aria-label="교재 원문 해설"><div class="source-explanation-heading"><strong>교재 원문 해설</strong><button type="button" class="source-open-button" onclick="App.openOriginalExplanation(${source.round},${source.pages[0]})">원본 전체 페이지 · 확대</button></div><p class="source-explanation-note">공통 지문·번역과 앞뒤 해설은 전체 페이지에서 함께 확인할 수 있습니다.</p>${figures}<a class="source-pdf-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">원본 PDF 열기</a></section>`;
  };

  app.openOriginalExplanation = function (round, page) {
    const pages = window.CBT_EXPLANATION_PAGES?.[round];
    if (!pages || !pages[page]) return;
    let dialog = document.getElementById("originalExplanationDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "originalExplanationDialog";
      dialog.className = "source-explanation-dialog";
      dialog.setAttribute("aria-label", "교재 원문 해설 확대");
      dialog.innerHTML = '<div class="source-dialog-toolbar"><strong id="sourceDialogTitle"></strong><div class="source-dialog-controls"><button type="button" id="sourcePrevPage" onclick="App.stepOriginalExplanation(-1)" aria-label="이전 원문 페이지">이전</button><button type="button" id="sourceNextPage" onclick="App.stepOriginalExplanation(1)" aria-label="다음 원문 페이지">다음</button><button type="button" id="sourceZoom" onclick="App.toggleOriginalExplanationZoom()">확대</button><button type="button" onclick="document.getElementById(\'originalExplanationDialog\').close()">닫기</button></div></div><div id="sourceDialogBody" class="source-dialog-body"><div id="sourceDialogImage"></div></div>';
      dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
      document.body.appendChild(dialog);
    }
    this._originalDialogRound = Number(round);
    this._originalDialogPage = Number(page);
    this._originalDialogZoom = false;
    this.updateOriginalExplanationDialog();
    if (!dialog.open) dialog.showModal();
  };

  app.updateOriginalExplanationDialog = function () {
    const round = this._originalDialogRound, page = this._originalDialogPage;
    const available = Object.keys(window.CBT_EXPLANATION_PAGES[round]).map(Number).sort((a, b) => a - b);
    const index = available.indexOf(page);
    document.getElementById("sourceDialogTitle").textContent = `제${round}회 해설 원본 · PDF ${page}쪽`;
    document.getElementById("sourcePrevPage").disabled = index === 0;
    document.getElementById("sourceNextPage").disabled = index === available.length - 1;
    document.getElementById("sourceZoom").textContent = this._originalDialogZoom ? "화면에 맞춤" : "확대";
    const body = document.getElementById("sourceDialogBody");
    body.classList.toggle("is-zoomed", this._originalDialogZoom);
    document.getElementById("sourceDialogImage").innerHTML = this.originalPageFrame(round, page, [0, 0, 1, 1], `제${round}회 해설 원본 PDF ${page}쪽`);
    body.scrollTop = 0; body.scrollLeft = 0;
  };

  app.stepOriginalExplanation = function (direction) {
    const pages = Object.keys(window.CBT_EXPLANATION_PAGES[this._originalDialogRound]).map(Number).sort((a, b) => a - b);
    const index = pages.indexOf(this._originalDialogPage);
    const next = Math.max(0, Math.min(pages.length - 1, index + direction));
    this._originalDialogPage = pages[next];
    this.updateOriginalExplanationDialog();
  };

  app.toggleOriginalExplanationZoom = function () {
    this._originalDialogZoom = !this._originalDialogZoom;
    this.updateOriginalExplanationDialog();
  };
})();
