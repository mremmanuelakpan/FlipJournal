import { Theme } from '../types/journal';

export interface ThemeConfig {
  id: Theme;
  name: string;
  bodyBg: string;
  bodyBgStyle: React.CSSProperties;
  navbarBg: string;
  navbarBorder: string;
  bookCoverBg: string;
  bookCoverStyle: React.CSSProperties;
  spineGradient: string;
  accentText: string;
  accentBg: string;
  badgeBg: string;
  primaryBtnBg: string;
  primaryBtnHover: string;
  activeHighlightBg: string;
  activeHighlightText: string;
  progressBarGradient: string;
  progressBarBg: string;
  ringBorderColor: string;
  pageDividerColor: string;
}

export const THEME_CONFIGS: Record<Theme, ThemeConfig> = {
  forest: {
    id: 'forest',
    name: 'Forest Green',
    bodyBg: '#0e1813',
    bodyBgStyle: {
      backgroundColor: '#0e1813',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #162b20 0%, #0e1813 70%)',
    },
    navbarBg: '#1b362a',
    navbarBorder: '#2d5845',
    bookCoverBg: '#244637',
    bookCoverStyle: {
      backgroundColor: '#244637',
      backgroundImage:
        'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 70%), linear-gradient(135deg, #1b362a 0%, #244637 40%, #1a3429 80%, #12241c 100%)',
    },
    spineGradient: 'linear-gradient(to right, rgba(0,0,0,0.6), rgba(255,255,255,0.08) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6))',
    accentText: '#dfc187',
    accentBg: '#c5a66a',
    badgeBg: 'bg-[#244637]',
    primaryBtnBg: '#244637',
    primaryBtnHover: '#1b362a',
    activeHighlightBg: '#244637',
    activeHighlightText: '#fef3c7',
    progressBarBg: '#244637',
    progressBarGradient: 'linear-gradient(to right, #183327 0%, #244637 50%, #36634e 100%)',
    ringBorderColor: '#244637',
    pageDividerColor: '#183327',
  },
  burgundy: {
    id: 'burgundy',
    name: 'Royal Burgundy',
    bodyBg: '#150608',
    bodyBgStyle: {
      backgroundColor: '#150608',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #2b0b12 0%, #150608 70%)',
    },
    navbarBg: '#330f14',
    navbarBorder: '#521922',
    bookCoverBg: '#4d1a20',
    bookCoverStyle: {
      backgroundColor: '#4d1a20',
      backgroundImage:
        'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 70%), linear-gradient(135deg, #3d1419 0%, #4d1a20 40%, #361115 80%, #240a0e 100%)',
    },
    spineGradient: 'linear-gradient(to right, rgba(0,0,0,0.65), rgba(255,255,255,0.08) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.65))',
    accentText: '#f0c797',
    accentBg: '#d49b6a',
    badgeBg: 'bg-[#4d1a20]',
    primaryBtnBg: '#5c1a23',
    primaryBtnHover: '#441219',
    activeHighlightBg: '#5c1a23',
    activeHighlightText: '#fef3c7',
    progressBarBg: '#5c1a23',
    progressBarGradient: 'linear-gradient(to right, #380d14 0%, #5c1a23 50%, #7d2633 100%)',
    ringBorderColor: '#5c1a23',
    pageDividerColor: '#380d14',
  },
  navy: {
    id: 'navy',
    name: 'Deep Navy',
    bodyBg: '#071018',
    bodyBgStyle: {
      backgroundColor: '#071018',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #0e2236 0%, #071018 70%)',
    },
    navbarBg: '#102133',
    navbarBorder: '#1c3654',
    bookCoverBg: '#182e44',
    bookCoverStyle: {
      backgroundColor: '#182e44',
      backgroundImage:
        'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 70%), linear-gradient(135deg, #112233 0%, #182e44 40%, #0d1a27 80%, #070e16 100%)',
    },
    spineGradient: 'linear-gradient(to right, rgba(0,0,0,0.65), rgba(255,255,255,0.08) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.65))',
    accentText: '#dfc187',
    accentBg: '#c5a66a',
    badgeBg: 'bg-[#182e44]',
    primaryBtnBg: '#19324a',
    primaryBtnHover: '#112233',
    activeHighlightBg: '#19324a',
    activeHighlightText: '#fef3c7',
    progressBarBg: '#19324a',
    progressBarGradient: 'linear-gradient(to right, #0e1c2a 0%, #19324a 50%, #284c6e 100%)',
    ringBorderColor: '#19324a',
    pageDividerColor: '#0e1c2a',
  },
  parchment: {
    id: 'parchment',
    name: 'Antique Leather',
    bodyBg: '#130f0c',
    bodyBgStyle: {
      backgroundColor: '#130f0c',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #261e16 0%, #130f0c 70%)',
    },
    navbarBg: '#2c2218',
    navbarBorder: '#473727',
    bookCoverBg: '#4a4033',
    bookCoverStyle: {
      backgroundColor: '#4a4033',
      backgroundImage:
        'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 70%), linear-gradient(135deg, #3a3227 0%, #4a4033 40%, #322b22 80%, #221d17 100%)',
    },
    spineGradient: 'linear-gradient(to right, rgba(0,0,0,0.6), rgba(255,255,255,0.08) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6))',
    accentText: '#dfc187',
    accentBg: '#c5a66a',
    badgeBg: 'bg-[#4a4033]',
    primaryBtnBg: '#4f4132',
    primaryBtnHover: '#392f23',
    activeHighlightBg: '#4f4132',
    activeHighlightText: '#fef3c7',
    progressBarBg: '#4f4132',
    progressBarGradient: 'linear-gradient(to right, #33281d 0%, #4f4132 50%, #6b5a47 100%)',
    ringBorderColor: '#4f4132',
    pageDividerColor: '#33281d',
  },
};

export function getTheme(theme: Theme = 'forest'): ThemeConfig {
  return THEME_CONFIGS[theme] || THEME_CONFIGS.forest;
}
