import { InjectionKey } from 'vue';
import { createStore, Store } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { defaultState } from './defaultState';
import { MeditationType, UserType, MeditationBriefType } from '@/helpers/types';

export interface State {
  isSound: boolean,
  halfChartTop: boolean,
  halfChartBottom: boolean,
  meditationZones: boolean,
  meditationTimeMax: number,
  meditationFrom: number,
  fromDay: string,
  meditationsBrief: MeditationBriefType[],
  meditationsData: {},
  meditations: MeditationType[],

  // not persistent
  user: UserType | undefined,
  mindwaveUrl: string,
  medLevels: Object,
  thresholdsFrequency: Object,
}


const persistentFields = [
  'isSound',
  'halfChartTop',
  'halfChartBottom',
  'meditationZones',
  'meditationTimeMax',
  'meditationFrom',
  'fromDay',
  'meditations',
  'meditationsBrief',
];

  // mutations с записью тупо значения в state
  const mutationFabric = (names:string[]) => {
    const mutations = {};
    names.map((name) => {
      mutations[name] = (state: any, val: any) => {
        state[name] = val;
        // console.log(`set state.${name}:`, val);
      };
    });
    return mutations;
  };


const mutations = mutationFabric([
  ...persistentFields,
  'user',
]);

export const key: InjectionKey<Store<State>> = Symbol('store');

const plugins = [];
if (!import.meta.env.SSR) {
  const persist = createPersistedState({
    paths: persistentFields,
  });
  plugins.push(persist)
}

export const store = createStore({
  state: defaultState,
  plugins,
  mutations,
});
