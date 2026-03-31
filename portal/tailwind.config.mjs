/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'viwra-navy': '#0a062b',
        'viwra-bone': '#f4f2e2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      keyframes: {
        // Breathing rings
        breathe: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.25' },
          '50%':       { transform: 'scale(1.09)', opacity: '0.65' },
        },
        breatheMid: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.35' },
          '50%':       { transform: 'scale(1.07)', opacity: '0.75' },
        },
        breatheInner: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.45' },
          '50%':       { transform: 'scale(1.05)', opacity: '0.85' },
        },
        // Film grain motion
        grain: {
          '0%, 100%': { transform: 'translate(0,    0)' },
          '10%':       { transform: 'translate(-2%,  -3%)' },
          '20%':       { transform: 'translate(3%,   2%)' },
          '30%':       { transform: 'translate(-1%,  4%)' },
          '40%':       { transform: 'translate(2%,  -1%)' },
          '50%':       { transform: 'translate(-3%,  3%)' },
          '60%':       { transform: 'translate(1%,  -2%)' },
          '70%':       { transform: 'translate(-2%,  1%)' },
          '80%':       { transform: 'translate(3%,  -3%)' },
          '90%':       { transform: 'translate(-1%,  2%)' },
        },
        // Step dot pulse
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%':       { transform: 'scale(1.5)', opacity: '1' },
        },
        // Underline expand on focus
        lineExpand: {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'breathe':        'breathe 6s ease-in-out infinite',
        'breathe-mid':    'breatheMid 5s ease-in-out infinite',
        'breathe-inner':  'breatheInner 4s ease-in-out infinite',
        'grain':          'grain 0.25s steps(1) infinite',
        'dot-pulse':      'dotPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
