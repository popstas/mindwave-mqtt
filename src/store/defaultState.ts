import { State } from "./index";
export const defaultState: State = {
  isSound: true,
  halfChartTop: false,
  halfChartBottom: false,
  meditationZones: true,
  meditationTimeMax: 300,
  meditationFrom: 70,
  fromDay: '',
  meditations: [],
  user: undefined,

  mindwaveUrl: 'http://localhost:9301/mindwave',
  // mindwaveUrl: 'https://test.home.popstas.ru/mindwave-test.php',
  medLevels: {
    low: 35,
    high: 50,
  },
  thresholdsFrequency: {
    0: 50,
    10: 40,
    20: 30,
    30: 20,
    40: 10,
    50: 3,
    60: 2,
    70: 1,
    80: 0,
    90: 0,
    100: 0,
  },
};
