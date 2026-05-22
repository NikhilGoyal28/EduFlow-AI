export const sourceColors = {
  'Facebook': '#1877F2',
  'Website': '#10B981',
  'WhatsApp': '#25D366'
};

export const statusColors = {
  'New': '#3B82F6',
  'Contacted': '#F59E0B',
  'Interested': '#8B5CF6',
  'Enrolled': '#10B981'
};

export const getThemeStyles = (darkMode) => ({
  background: darkMode 
    ? 'radial-gradient(circle at top left, #0f172a, #020617)' 
    : 'radial-gradient(circle at top left, #f8fafc, #e2e8f0)',
  color: darkMode ? '#F8FAFC' : '#0F172A',
  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  textColorMuted: darkMode ? '#94A3B8' : '#64748B',
  inputBackground: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)',
  glassClass: darkMode ? 'glass-panel-dark' : 'glass-panel-light',
  gradientText: 'linear-gradient(to right, #3B82F6, #8B5CF6)',
});
