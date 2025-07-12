import { useState, useEffect, useCallback } from 'react';

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  totalQuestions: number;
  correctAnswers: number;
  achievements: Achievement[];
  lastActivity: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'target' | 'award';
  unlockedAt: string;
  isNew: boolean;
}

const INITIAL_STATE: GamificationState = {
  xp: 0,
  level: 1,
  streak: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  achievements: [],
  lastActivity: null
};

const XP_PER_LEVEL = 1000;
const XP_CORRECT_ANSWER = 10;
const XP_STREAK_BONUS = 5;

export function useGamification() {
  const [state, setState] = useState<GamificationState>(() => {
    const saved = localStorage.getItem('gamification_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('gamification_state', JSON.stringify(state));
  }, [state]);

  const checkForNewLevel = useCallback((newXp: number, oldLevel: number) => {
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    if (newLevel > oldLevel) {
      setShowConfetti(true);
      setFeedbackMessage({ type: 'success', message: `🎉 Parabéns! Você chegou ao nível ${newLevel}!` });
      return newLevel;
    }
    return oldLevel;
  }, []);

  const checkForAchievements = useCallback((newState: GamificationState) => {
    const newAchievements: Achievement[] = [];
    const now = new Date().toISOString();

    // Primeira pergunta
    if (newState.totalQuestions === 1 && !newState.achievements.some(a => a.id === 'first_question')) {
      newAchievements.push({
        id: 'first_question',
        title: 'Primeiro Passo',
        description: 'Respondeu sua primeira pergunta',
        icon: 'star',
        unlockedAt: now,
        isNew: true
      });
    }

    // Streak de 5
    if (newState.streak >= 5 && !newState.achievements.some(a => a.id === 'streak_5')) {
      newAchievements.push({
        id: 'streak_5',
        title: 'Em Chamas!',
        description: 'Manteve uma sequência de 5 dias',
        icon: 'trophy',
        unlockedAt: now,
        isNew: true
      });
    }

    // 10 respostas corretas
    if (newState.correctAnswers >= 10 && !newState.achievements.some(a => a.id === 'correct_10')) {
      newAchievements.push({
        id: 'correct_10',
        title: 'Conhecedor',
        description: 'Acertou 10 perguntas',
        icon: 'target',
        unlockedAt: now,
        isNew: true
      });
    }

    // Precisão de 90%
    const accuracy = newState.totalQuestions > 0 ? (newState.correctAnswers / newState.totalQuestions) * 100 : 0;
    if (accuracy >= 90 && newState.totalQuestions >= 10 && !newState.achievements.some(a => a.id === 'accuracy_90')) {
      newAchievements.push({
        id: 'accuracy_90',
        title: 'Perfeccionista',
        description: 'Manteve 90% de precisão em 10+ perguntas',
        icon: 'award',
        unlockedAt: now,
        isNew: true
      });
    }

    return newAchievements;
  }, []);

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    const lastActivity = state.lastActivity ? new Date(state.lastActivity).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastActivity === today) {
      return state.streak; // Já ativo hoje
    } else if (lastActivity === yesterday) {
      return state.streak + 1; // Continua streak
    } else {
      return 1; // Reset streak
    }
  }, [state.lastActivity, state.streak]);

  const addCorrectAnswer = useCallback(() => {
    setState(prevState => {
      const newStreak = updateStreak();
      const baseXp = XP_CORRECT_ANSWER;
      const streakBonus = newStreak > 1 ? XP_STREAK_BONUS * (newStreak - 1) : 0;
      const totalXpGain = baseXp + streakBonus;
      
      const newXp = prevState.xp + totalXpGain;
      const newLevel = checkForNewLevel(newXp, prevState.level);
      
      const newState = {
        ...prevState,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        totalQuestions: prevState.totalQuestions + 1,
        correctAnswers: prevState.correctAnswers + 1,
        lastActivity: new Date().toISOString()
      };

      const newAchievements = checkForAchievements(newState);
      if (newAchievements.length > 0) {
        newState.achievements = [...prevState.achievements, ...newAchievements];
      }

      setFeedbackMessage({ 
        type: 'success', 
        message: `+${totalXpGain} XP ${streakBonus > 0 ? `(Bônus Streak: +${streakBonus})` : ''}` 
      });

      return newState;
    });
  }, [updateStreak, checkForNewLevel, checkForAchievements]);

  const addWrongAnswer = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      totalQuestions: prevState.totalQuestions + 1,
      lastActivity: new Date().toISOString()
    }));

    setFeedbackMessage({ type: 'error', message: 'Não foi desta vez! Continue tentando!' });
  }, []);

  const markAchievementAsRead = useCallback((achievementId: string) => {
    setState(prevState => ({
      ...prevState,
      achievements: prevState.achievements.map(achievement =>
        achievement.id === achievementId
          ? { ...achievement, isNew: false }
          : achievement
      )
    }));
  }, []);

  const resetSession = useCallback(() => {
    setState(INITIAL_STATE);
    setShowConfetti(false);
    setFeedbackMessage(null);
  }, []);

  const getAccuracy = useCallback(() => {
    return state.totalQuestions > 0 ? Math.round((state.correctAnswers / state.totalQuestions) * 100) : 0;
  }, [state.correctAnswers, state.totalQuestions]);

  const getNextLevelProgress = useCallback(() => {
    const currentLevelXp = (state.level - 1) * XP_PER_LEVEL;
    const nextLevelXp = state.level * XP_PER_LEVEL;
    const progress = state.xp - currentLevelXp;
    const total = nextLevelXp - currentLevelXp;
    return { progress, total, percentage: (progress / total) * 100 };
  }, [state.xp, state.level]);

  return {
    state,
    showConfetti,
    feedbackMessage,
    actions: {
      addCorrectAnswer,
      addWrongAnswer,
      markAchievementAsRead,
      resetSession
    },
    computed: {
      getAccuracy,
      getNextLevelProgress
    },
    setShowConfetti,
    setFeedbackMessage
  };
}