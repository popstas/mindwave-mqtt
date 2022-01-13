import { InjectionKey } from 'vue';
import { createStore, Store } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { defaultState } from './defaultState';
import { MeditationType, MeditationDataType } from '@/helpers/types';

export interface State {
  isSound: boolean,
  halfChartTop: boolean,
  halfChartBottom: boolean,
  meditationZones: boolean,
  meditationTimeMax: number,
  meditationFrom: number,
  fromDay: string,
  meditations: MeditationType[],

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
];

  // mutations с записью тупо значения в state
  const mutationFabric = (names:string[]) => {
    const mutations = {};
    names.map((name) => {
      mutations[name] = (state: any, val: any) => {
        state[name] = val;
      };
    });
    return mutations;
  };


const mutations = mutationFabric(persistentFields);

export const key: InjectionKey<Store<State>> = Symbol('store');
export const store = createStore({
  state: defaultState,
  /* plugins: [
    createPersistedState({
      paths: persistentFields,
    }),
  ], */
  mutations,
});
