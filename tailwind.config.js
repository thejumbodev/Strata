export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        /* All colors reference the CSS variables defined in index.css */
        bg:           'var(--bg)',
        surface:      'var(--surface)',
        card:         'var(--card)',
        input:        'var(--input)',
        t1:           'var(--text)',
        t2:           'var(--text2)',
        muted:        'var(--text3)',
        accent:       'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        success:      'var(--success)',
        danger:       'var(--danger)',
      },
      borderRadius: {
        card:  'var(--radius)',
        input: 'var(--radius-sm)',
        panel: 'var(--radius-lg)',
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.45)',
        'card-drag':  '0 12px 32px rgba(0,0,0,0.7)',
        panel:      '-4px 0 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
