import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        // Azul Guardião - Cor principal
        guardian: {
          50: '#EBF1FE',
          100: '#D6E4FD',
          200: '#ADC9FB',
          300: '#85AEF9',
          400: '#5C93F7',
          500: '#2A6FF0',
          600: '#2159C0',
          700: '#194390',
          800: '#102C60',
          900: '#081630',
          950: '#040B18'
        },
        // Verde Controle - Sucesso
        controle: {
          50: '#EEFBF3',
          100: '#D6F5E3',
          200: '#AEEBC7',
          300: '#86E0AB',
          400: '#5ED68F',
          500: '#4CC17A',
          600: '#3D9A62',
          700: '#2E7449',
          800: '#1F4D31',
          900: '#0F2718',
          950: '#08130C'
        },
        // Laranja Alerta - Avisos
        alerta: {
          50: '#FEF6EB',
          100: '#FDEDD6',
          200: '#FBDAAD',
          300: '#F9C885',
          400: '#F7B55C',
          500: '#F6A63A',
          600: '#C4852E',
          700: '#936323',
          800: '#624217',
          900: '#31210C',
          950: '#181006'
        },
        // Cinza Operação - Fundo
        operacao: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#F2F2F5',
          300: '#E5E5E5',
          400: '#71717A',
          500: '#3F3F46',
          600: '#27272A',
          700: '#18181B',
          800: '#09090B',
          900: '#000000',
          950: '#000000'
        }
      }
    }
  }
} satisfies Partial<Config>
