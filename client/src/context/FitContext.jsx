import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const FitContext = createContext(null);

export function FitProvider({ children }) {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState(null);
  const [weekStats, setWeekStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchTodayStats = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingStats(true);
      const res = await api.get('/stats/today');
      setTodayStats(res.data);
    } catch (e) {
      // silent fail
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  const fetchWeekStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/stats/week');
      setWeekStats(res.data);
    } catch (e) { /* silent */ }
  }, [user]);

  const refreshTodayStats = useCallback(() => {
    fetchTodayStats();
    fetchWeekStats();
  }, [fetchTodayStats, fetchWeekStats]);

  useEffect(() => {
    if (user?.setupDone) {
      fetchTodayStats();
      fetchWeekStats();
    }
  }, [user?.setupDone]);

  return (
    <FitContext.Provider value={{ todayStats, weekStats, loadingStats, refreshTodayStats }}>
      {children}
    </FitContext.Provider>
  );
}

export function useFit() {
  return useContext(FitContext);
}
