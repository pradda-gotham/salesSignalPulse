// Vesper Logic Design System shared tokens

export const getVL = (isDarkMode: boolean) => ({
  primary: '#635BFF',
  primaryHover: '#4F46E5',
  primarySoft: isDarkMode ? 'rgba(99,91,255,0.12)' : '#F0F1FF',
  surface: isDarkMode ? '#141414' : '#FFFFFF',
  surfaceMuted: isDarkMode ? '#0f0f0f' : '#F8F9FB',
  border: isDarkMode ? 'rgba(255,255,255,0.07)' : '#F1F3F5',
  borderStrong: isDarkMode ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
  textMain: isDarkMode ? '#EDEDED' : '#191C1E',
  textBody: isDarkMode ? '#94A3B8' : '#4A5568',
  textMuted: isDarkMode ? '#64748B' : '#94A3B8',
  tableHeader: isDarkMode ? '#0f0f0f' : '#F8F9FB',
  rowHover: isDarkMode ? 'rgba(255,255,255,0.02)' : '#FAFBFC',
  shadow: '0 1px 2px rgba(0,0,0,0.05)',
  chipBg: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F3F5',
  chipText: isDarkMode ? '#94A3B8' : '#4A5568',
});
