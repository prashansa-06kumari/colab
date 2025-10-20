/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CollabSpace Premium Color Palette
        'primary-dark': '#0F1E3F',
        'secondary-blue': '#213A56',
        'accent-gold': '#CDAA80',
        'bronze-tone': '#997953',
        'panel-bg': '#162B4C',
        'text-bright': '#F2F2F2',
        'text-main': '#F1F1F1',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 12s linear infinite',
        'button-press': 'buttonPress 0.15s ease-out',
        'message-appear': 'messageAppear 0.25s ease-out',
        'panel-load': 'panelLoad 0.4s ease-out',
        'gold-glow': 'goldGlow 1.5s ease-in-out infinite alternate',
        'rotate-hover': 'rotateHover 0.3s ease-in-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 5px #CDAA80' },
          '50%': { boxShadow: '0 0 15px #CDAA80, 0 0 25px #CDAA80' },
          '100%': { boxShadow: '0 0 5px #CDAA80' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        buttonPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        messageAppear: {
          '0%': { opacity: '0', transform: 'translateY(15px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        panelLoad: {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        goldGlow: {
          '0%': { boxShadow: '0 0 8px #CDAA80' },
          '100%': { boxShadow: '0 0 20px #CDAA80, 0 0 30px #CDAA80' },
        },
        rotateHover: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(90deg)' },
        },
      },
    },
  },
  plugins: [],
}
