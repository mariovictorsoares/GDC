import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        // Azul Institucional - Cor principal (CMV360)
        guardian: {
          50: '#EEF4FB',
          100: '#D4E4F5',
          200: '#A9C9EB',
          300: '#7EAEE1',
          400: '#5393D7',
          500: '#0E63B6',
          600: '#0B529A',
          700: '#0A4180',
          800: '#0F3C78',
          900: '#062244',
          950: '#031227'
        },
        // Azul-Verde Corporativo - Sucesso
        controle: {
          50: '#ECFBF5',
          100: '#D0F5E6',
          200: '#A1EBCD',
          300: '#72E1B4',
          400: '#43D79B',
          500: '#0D9668',
          600: '#0B7A55',
          700: '#085E41',
          800: '#06422E',
          900: '#03261A',
          950: '#02130D'
        },
        // Amber Profundo - Avisos
        alerta: {
          50: '#FEF8EC',
          100: '#FDF0D0',
          200: '#FBE0A1',
          300: '#F9D172',
          400: '#F7C143',
          500: '#D97706',
          600: '#B86205',
          700: '#8A4A04',
          800: '#5C3103',
          900: '#2E1901',
          950: '#170C01'
        },
        // Grafite Frio - Neutro (CMV360)
        operacao: {
          50: '#F8F8F9',
          100: '#F0F0F2',
          200: '#D8D8DD',
          300: '#B4B4BD',
          400: '#8E8E9A',
          500: '#5A5A66',
          600: '#3E3E48',
          700: '#2C2C34',
          800: '#1C1C1C',
          900: '#0F0F0F',
          950: '#070708'
        }
      }
    }
  }
} satisfies Partial<Config>
