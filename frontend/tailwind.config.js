/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
        },
        background: {
          DEFAULT: 'var(--color-background)',
          alt: 'var(--color-background-alt)',
        },
        surface: 'var(--color-surface)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: 'var(--color-border)',
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
        },
        pending: {
          DEFAULT: 'var(--color-pending)',
          bg: 'var(--color-pending-bg)',
        },
        badge: {
          blue: {
            bg: 'var(--color-badge-blue-bg)',
            text: 'var(--color-badge-blue-text)',
          },
        },
        focus: 'var(--color-focus)',
        overlay: 'var(--color-overlay)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'system-ui',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        display: [
          '48px',
          { lineHeight: '1.00', letterSpacing: '-1.5px', fontWeight: '700' },
        ],
        'heading-lg': [
          '26px',
          { lineHeight: '1.23', letterSpacing: '-0.625px', fontWeight: '700' },
        ],
        'heading-md': [
          '22px',
          { lineHeight: '1.27', letterSpacing: '-0.25px', fontWeight: '700' },
        ],
        'body-lg': [
          '20px',
          { lineHeight: '1.40', letterSpacing: '-0.125px', fontWeight: '600' },
        ],
        body: [
          '16px',
          { lineHeight: '1.50', letterSpacing: 'normal', fontWeight: '400' },
        ],
        'body-medium': [
          '16px',
          { lineHeight: '1.50', letterSpacing: 'normal', fontWeight: '500' },
        ],
        'body-semibold': [
          '16px',
          { lineHeight: '1.50', letterSpacing: 'normal', fontWeight: '600' },
        ],
        'nav-button': [
          '15px',
          { lineHeight: '1.33', letterSpacing: 'normal', fontWeight: '600' },
        ],
        caption: [
          '14px',
          { lineHeight: '1.43', letterSpacing: 'normal', fontWeight: '500' },
        ],
        'caption-light': [
          '14px',
          { lineHeight: '1.43', letterSpacing: 'normal', fontWeight: '400' },
        ],
        badge: [
          '12px',
          { lineHeight: '1.33', letterSpacing: '0.125px', fontWeight: '600' },
        ],
        micro: [
          '12px',
          { lineHeight: '1.33', letterSpacing: '0.125px', fontWeight: '400' },
        ],
      },
      borderRadius: {
        micro: 'var(--radius-micro)',
        subtle: 'var(--radius-subtle)',
        standard: 'var(--radius-standard)',
        comfortable: 'var(--radius-comfortable)',
        large: 'var(--radius-large)',
        pill: 'var(--radius-pill)',
        circle: 'var(--radius-circle)',
      },
      spacing: {
        px2: 'var(--space-px-2)',
        px4: 'var(--space-px-4)',
        px8: 'var(--space-px-8)',
        px12: 'var(--space-px-12)',
        px16: 'var(--space-px-16)',
        px24: 'var(--space-px-24)',
        px32: 'var(--space-px-32)',
        px48: 'var(--space-px-48)',
        px64: 'var(--space-px-64)',
        px80: 'var(--space-px-80)',
        px120: 'var(--space-px-120)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        deep: 'var(--shadow-deep)',
      },
    },
  },
  plugins: [],
}
