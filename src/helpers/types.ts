// export interface MeditationType {
//   meditationStart: number;
//   meditationTime: number;
//   history: Meditation[];
// }

export interface MeditationType {
  name: string,
  meditationStart: number,
  meditationTime: number,
  history: MeditationDataType[],
  thresholdsData: {},
  tick: number,
  totalSum: number,

  meditationCompare: {},
  state: string,
  isPlay: boolean, // TODO: to store
  lastDataTime: number,
}

interface ThresholdsType {
  [key: number]: {
    total: number,
    loses: number,
    start: number,
    maxTime: number,
  }
}

export interface ThresholdsDataType {
  meditation: {
    totalSum: number,
    tick: number
    average: number,
    thresholds: ThresholdsType
  },
  attention: {
    totalSum: number,
    tick: number
    average: number,
    thresholds: ThresholdsType
  },
}

export interface MeditationBriefType {
  name: string,
  startTime: number,
  durationTime: number,
  thresholdsData: ThresholdsDataType,
}

export interface MeditationDataType {
  d: number, // date
  m: number, // meditation
  a: number, // attention
}

export interface UserType {
  uid: string,
  photoURL?: string,
  displayName?: string,
  email?: string,
}
