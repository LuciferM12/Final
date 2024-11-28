/** @type {import('tailwindcss').Config} */
export default {
  darkMode:["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      screens: {
        '2xl': {
          max: '1535px'
        },
        xl: {
          max: '1279px'
        },
        lg: {
          max: '1023px'
        },
        md: {
          max: '767px'
        },
        sm: {
          max: '639px'
        },
        xs: {
          max: '479px'
        }
      }
    },
  },
  plugins: [],
}

