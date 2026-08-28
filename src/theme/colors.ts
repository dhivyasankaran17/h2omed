// Palette lifted from the Dribbble "Water Tracker Mobile iOS App Design" reference
// (deep teal/blue surfaces, teal + blue accents, pale blue-grey highlights).
export const colors = {
  background: '#031216',
  surface: '#0E493D',
  surfaceAlt: '#03344D',
  accentTeal: '#188668',
  accentTealLight: '#4AA8AA',
  accentBlue: '#1B50B9',
  pale: '#C0D6DF',
  white: '#FFFFFF',
  textPrimary: '#F4FAF9',
  textSecondary: 'rgba(244, 250, 249, 0.65)',
  danger: '#D9534F',
  warning: '#E0A94D',
  cardBorder: 'rgba(192, 214, 223, 0.15)',
  // Bright neon accents for glow rings / gauges (the "lit-from-within" look).
  neonCyan: '#5FE3E6',
  neonBlue: '#5B8CFF',
} as const;

export const statusColors = {
  pending: colors.pale,
  taken: colors.accentTeal,
  snoozed: colors.warning,
  missed: colors.danger,
} as const;

// Gradient stop sets, reused across the background wash, glow orbs, and buttons
// so every "graphical" surface in the app pulls from the same light source.
export const gradients = {
  screen: ['#020C0F', colors.background, '#082A26'] as const,
  glowTeal: ['rgba(74, 168, 170, 0.55)', 'rgba(74, 168, 170, 0)'] as const,
  glowBlue: ['rgba(27, 80, 185, 0.45)', 'rgba(27, 80, 185, 0)'] as const,
  tealButton: [colors.accentTealLight, colors.accentTeal] as const,
  blueButton: ['#2F6FE0', colors.accentBlue] as const,
  warningButton: ['#F0C06B', colors.warning] as const,
  dangerButton: ['#E27470', colors.danger] as const,
  glassCard: ['rgba(192, 214, 223, 0.14)', 'rgba(192, 214, 223, 0.04)'] as const,
  vesselFill: [colors.accentTealLight, colors.accentTeal] as const,
  bodyFill: [colors.neonCyan, colors.accentTeal] as const,
  glowCyan: ['rgba(95, 227, 230, 0.5)', 'rgba(95, 227, 230, 0)'] as const,
  reflection: ['rgba(95, 227, 230, 0)', 'rgba(95, 227, 230, 0.22)', 'rgba(95, 227, 230, 0)'] as const,
} as const;
