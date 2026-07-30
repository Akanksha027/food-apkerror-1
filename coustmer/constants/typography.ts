/**
 * Swiggy-style typography.
 * Basis Grotesque / Proxima Nova aren't free — Plus Jakarta Sans (display)
 * + DM Sans (UI) are the closest open matches recommended for Swiggy clones.
 */
export const fonts = {
  display: 'Satoshi-Black',
  displayBold: 'Satoshi-Bold',
  displaySemi: 'Satoshi-Medium',
  displayMedium: 'Satoshi-Medium',
  displayRegular: 'Satoshi-Regular',
  ui: 'Satoshi-Regular',
  uiMedium: 'Satoshi-Medium',
  uiSemi: 'Satoshi-Medium',
  uiBold: 'Satoshi-Bold',
  script: 'Satoshi-Regular',
  bubbly: 'Satoshi-Bold',
} as const;

export const type = {
  locationTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  locationSub: {
    fontFamily: fonts.ui,
    fontSize: 12,
  },
  searchPlaceholder: {
    fontFamily: fonts.ui,
    fontSize: 14,
  },
  heroWelcome: {
    fontFamily: fonts.displayRegular,
    fontSize: 22,
  },
  heroScript: {
    fontFamily: fonts.script,
    fontSize: 28,
  },
  promoTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  filterChip: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  restaurantName: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  meta: {
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: -0.3,
  },
} as const;
