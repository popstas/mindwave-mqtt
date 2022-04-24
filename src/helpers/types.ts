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
