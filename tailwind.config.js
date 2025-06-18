import theme from "./src/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        white: theme.COLORS.WHITE,
        gray: {
          100: theme.COLORS.GRAY_100,
          200: theme.COLORS.GRAY_200,
          300: theme.COLORS.GRAY_300,
          400: theme.COLORS.GRAY_400,
          500: theme.COLORS.GRAY_500,
          600: theme.COLORS.GRAY_600,
          700: theme.COLORS.GRAY_700,
        },
        green: {
          100: theme.COLORS.GREEN_100,
          200: theme.COLORS.GREEN_200,
          300: theme.COLORS.GREEN_300,
          400: theme.COLORS.GREEN_400,
          500: theme.COLORS.GREEN_500,
          600: theme.COLORS.GREEN_600,
          700: theme.COLORS.GREEN_700,
          800: theme.COLORS.GREEN_800_CUSTOM,
          logo: theme.COLORS.GREEN_LOGO,
          logo2: theme.COLORS.GREEN_LOGO2,
        },
        brown: {
          logo: theme.COLORS.BROWN_LOGO,
          100: theme.COLORS.BROWN_100,
          200: theme.COLORS.BROWN_200,
          300: theme.COLORS.BROWN_300,
          400: theme.COLORS.BROWN_400,
          500: theme.COLORS.BROWN_500,
          600: theme.COLORS.BROWN_600_CUSTOM,
        },
      },

      fontFamily: {
        regular: [theme.FONT_FAMILY.REGULAR],
        bold: [theme.FONT_FAMILY.BOLD],
      },

      fontSize: {
        xs: `${theme.FONT_SIZE.XS}px`,
        sm: `${theme.FONT_SIZE.SM}px`,
        base: `${theme.FONT_SIZE.MD}px`,
        lg: `${theme.FONT_SIZE.LG}px`,
        xl: `${theme.FONT_SIZE.XL}px`,
        "2xl": `${theme.FONT_SIZE.XXL}px`,
      },
    },
  },
  plugins: [],
};
