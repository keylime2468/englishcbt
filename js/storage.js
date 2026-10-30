// ============================================================================
// CBT Exam Persistence Engine (localStorage Manager)
// ============================================================================
(function() {
  const STORAGE_KEY = "KCCI_TRADE_ENG_CBT_HISTORY";

  const StorageManager = {
    getAllHistory: function() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error("Failed to read CBT history from localStorage:", e);
        return [];
      }
    },

    saveExamResult: function(record) {
      try {
        const history = this.getAllHistory();
        const newRecord = {
          id: "exam_" + Date.now(),
          round: record.round,
          roundTitle: record.roundTitle,
          yearLabel: record.yearLabel,
          createdAt: new Date().toISOString(),
          formattedDate: new Date().toLocaleString("ko-KR", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit"
          }),
          timeSpentSeconds: record.timeSpentSeconds || 0,
          scores: {
            s1: record.scores.s1, // 제1과목 (점수)
            s2: record.scores.s2, // 제2과목
            s3: record.scores.s3, // 제3과목
            totalAvg: record.scores.totalAvg,
            isPass: record.scores.isPass
          },
          answeredCount: record.answeredCount,
          correctCount: record.correctCount,
          answers: record.answers, // 75 choices
          flags: record.flags,     // 75 flags
          wrongQuestions: record.wrongQuestions || [] // list of wrong item summaries
        };

        history.unshift(newRecord);
        // keep up to 50 attempts
        if (history.length > 50) history.pop();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return newRecord;
      } catch (e) {
        console.error("Failed to save CBT result to localStorage:", e);
        return null;
      }
    },

    getRecordById: function(id) {
      const history = this.getAllHistory();
      return history.find(r => r.id === id) || null;
    },

    deleteRecord: function(id) {
      try {
        let history = this.getAllHistory();
        history = history.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return true;
      } catch (e) {
        console.error("Failed to delete record:", e);
        return false;
      }
    },

    clearAllHistory: function() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
      } catch (e) {
        console.error("Failed to clear history:", e);
        return false;
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
  }
})();
