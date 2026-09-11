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
        surface:    'rgba(30, 30, 36, 0.68)',
        card:       'rgba(30, 30, 36, 0.68)',
        cardHero:   'rgba(32, 32, 40, 0.75)',
        cardAlt:    'rgba(36, 36, 44, 0.65)',
        border:     'rgba(255, 255, 255, 0.09)',
        borderGlint:'rgba(255, 255, 255, 0.16)',
        // Text & labels
        primary:    '#FFFFFF',
        secondary:  '#9A9AA6',
        muted:      '#8A8A98',
        sublabel:   '#8A8A98',
        // Accent / brand — pastel lavender
        accent:     '#8E7CFF',
        accentLight:'#8E7CFF',
        // Outcome colours
        flash:      '#6EE756',
        send:       '#8E7CFF',
        attempt:    '#E8DEB5',
        fail:       '#484852',
      },
    },
  },
  plugins: [],
};
