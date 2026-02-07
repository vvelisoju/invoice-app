export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        primaryHover: '#1D4ED8',
        bgPrimary: '#F3F4F6',
        bgSecondary: '#FFFFFF',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        borderLight: '#F9FAFB',
        accentYellow: '#FEF3C7',
        accentYellowText: '#92400E'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        card: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)'
      }
    }
  },
  plugins: []
}
