/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // App surface palette (textured speckled background shows through transparent)
        background: 'transparent',
        surface:    '#1A1A1E',
        card:       '#1E1E24',
        cardAlt:    '#222227',
        border:     '#2D2D35',
        borderGlint:'rgba(255, 255, 255, 0.08)',
        // Text & labels
        primary:    '#FFFFFF',
        secondary:  '#9CA3AF',
        muted:      '#7A7A88',
        sublabel:   '#7A7A88',
        // Accent / brand — pastel lavender
        accent:     '#8E7CFF',
        accentLight:'#A78BFA',
        // Outcome colours
        flash:      '#6EE756',
        send:       '#8E7CFF',
        attempt:    '#E8DEB5',
        fail:       '#55555D',
      },
    },
  },
  plugins: [],
};
