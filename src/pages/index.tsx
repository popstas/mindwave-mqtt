import { defineComponent, onMounted, ref, watch, computed } from 'vue';
import useStore from '@/helpers/useStore';
import Settings from '@/components/Settings';
import CurrentMeditation from '@/components/CurrentMeditation';
import MeditationsList from '@/components/MeditationsList';
import DaysList from '@/components/DaysList';
import NoSleep from 'nosleep.js';
import { mmss } from '@/helpers/utils';
import { ElButton } from 'element-plus';
import { dayFormat } from "@/helpers/utils";
import DaysChart from '@/components/DaysChart';
import Profile from '@/components/Profile';
import { MeditationBriefType, MeditationDataType, ThresholdsDataType } from '@/helpers/types';
import { dbGet, dbRemove, dbSet } from '@/helpers/firebaseDb';

interface NoSleepType {
  enable: () => any,
  disable: () => any,
}

export default defineComponent({
  name: 'MainPage',
  setup(props, context) {
    const store = useStore();

    let nosleep: NoSleepType;
    if (!import.meta.env.SSR) nosleep = new NoSleep();
    else nosleep = {
      enable: () => new Promise(()=>{}),
      disable: () => {},
    }
    // console.log('store:', store);
    // console.log('props:', props);

    // sound
    let audioCtx: AudioContext; // should be inited later, not here
    let oscillator: OscillatorNode; // for audioInit
















    // TODO: define type
    const cur = ref({
      meditationStart: Date.now(),
      meditationTime: 0,
      history: [] as MeditationDataType[],
      thresholdsData: {} as ThresholdsDataType,
      name: '',
      tick: 0,
      totalSum: 0,

      meditationCompare: false,
      state: 'idle',
      isPlay: false,
      lastDataTime: 0,
    });

    // TODO: define type
    const mindwaveData = ref({
      meditation: 0,
      attention: null,
      lowAlpha: null,
      highAlpha: null,
      lowBeta: null,
      highBeta: null,
      lowGamma: null,
      highGamma: null,
      signal: null,
    });









    // computed
    const thresholds = computed(() => {
      const thresholds = [70, 80, 90, 100];
      if (!thresholds.includes(store.state.settings.meditationFrom)) {
        thresholds.push(store.state.settings.meditationFrom);
        return thresholds.sort();
      }
      return thresholds;
    });

    const meditation = computed(() => mindwaveData.value.meditation);
    const attention = computed(() => mindwaveData.value.attention);
    const signal = computed(() => mindwaveData.value.signal);
    const isSound = computed(() => store.state.settings.isSound);
    const lastDataTime = computed(() => cur.value.lastDataTime);

    const days = computed(() => {
      const days = {};
      // console.log('this.meditations: ', this.meditations);

      let minDate: number, maxDate: number;

      // собирает days
      store.state.meditationsBrief.forEach((med) => {
        const day = dayFormat(med.startTime - 6 * 3600 * 1000); // до 6 утра считаем за вчера
        const date = new Date(day).getTime();
        // TODO: add type
        const ds = days[day] || {
          date: date,
          count: 0,
          time: 0,
          med70total: 0,
          med70avg: 0,
          med80total: 0,
          med80avg: 0,
          med90total: 0,
          med90avg: 0,
          med100total: 0,
          med100avg: 0,
          medAvg: 0,
          meditation: 0,
        };

        // min max
        if (!minDate || minDate > date) minDate = date;
        if (!maxDate || maxDate < date) maxDate = date;

        // поля дня
        ds.count++;
        ds.time += med.durationTime;
        for (let t of [70, 80, 90, 100]) {
          // med70total
          const key = 'med' + t + 'total';
          ds[key] += med.thresholdsData.meditation.thresholds[t].total;
        }

        ds.medAvg += med.thresholdsData.meditation.average;

        days[day] = ds;
      });

      // заполняем пустые дни
      for (let date = minDate; date < maxDate; date += 86400000) {
        const day = dayFormat(date);
        if (!days[day]) {
          days[day] = {
            date: date,
            time: 0,
          };
        }
      }

      // переводим объект в массив и считаем средние
      const daysArr = [];
      // console.log('days: ', days);
      // тут вся статистика в days
      for (let day in days) {
        const ds = days[day];
        if (store.state.settings.fromDay && ds.date < new Date(store.state.settings.fromDay)) continue; // limit From day

        // считаем средние
        for (let t of [70, 80, 90, 100]) {
          const keyTotal = 'med' + t + 'total';
          const keyAvg = 'med' + t + 'avg';
          ds[keyAvg] = (ds[keyTotal] / ds.time) * 100;
          if (isNaN(ds[keyAvg])) ds[keyAvg] = 0;
        }
        ds.day = day;

        // валидация
        ds.isMeditationHigh = ds.med70avg >= store.state.medLevels.high ? 100 : 0;
        ds.isMeditationMed =
          ds.med70avg >= store.state.medLevels.low && ds.med70avg < store.state.medLevels.high ? 100 : 0;
        ds.isMeditationLow = ds.med70avg < store.state.medLevels.low && ds.med70avg > 0 ? 100 : 0;
        ds.med70totalPoints = ds.med70total / 15; // коэф. чтобы показать кол-во времени в медитации по дням
        ds.med70totalMins = Math.round((ds.med70total / 60) * 10) / 10;
        if (isNaN(ds.med70totalMins)) ds.med70totalMins = 0;

        ds.mins = Math.round(ds.time / 60);

        daysArr.push(ds);

        // medAvg
        ds.medAvg = ds.medAvg / ds.count;
      }

      // console.log('daysArr: ', daysArr);
      return daysArr.sort((b, a) => {
        if (a.date > b.date) return 1;
        if (a.date < b.date) return -1;
        return 0;
      });
    });


    // update from server
    async function updateMindwaveData() {
      const headers = new Headers();

      try {
        const response = await fetch(store.state.mindwaveUrl, {
          headers: headers,
        });

        const data = await response.json();

        // console.log('mindwaveData: ', mindwaveData);
        let changed = [];
        for (let name in data) {
          // console.log(`mindwaveData[${name}]:`, mindwaveData.value[name]);
          const isChanged = mindwaveData.value[name] === parseInt(data[name]);
          if (isChanged) changed.push(name);
          mindwaveData.value[name] = parseInt(data[name]);
        }

        // only if data changes, remove it for every second tick
        if (changed.length > 0) cur.value.lastDataTime = Date.now();
      } catch (e) {
        console.log(e);
      }
    }

    function updateMeditation(val: number) {
      // console.log(`watch meditation, tick: ${cur.value.tick}, val: `, val);

      // started meditation
      if (!cur.value.meditationStart || cur.value.state === 'stop') return;

      processThresholds({ field: 'meditation', value: val });

      // время сессии
      cur.value.meditationTime = Math.round((Date.now() - cur.value.meditationStart) / 1000);

      // среднее, только при хорошем сигнале
      // здесь по идее всегда сигнал 0
      if (mindwaveData.value.signal === 0 && mindwaveData.value.meditation > 0) {
        cur.value.tick++;
        cur.value.totalSum += val;
        addHistory();
        drawChart();
        drawChartHistory();
      }

      // звук
      let freq = 0;
      for (let threshold in store.state.thresholdsFrequency) {
        const f = store.state.thresholdsFrequency[threshold];
        if (val > parseInt(threshold)) freq = f;
      }
      // console.log('med freq: ', freq);
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // mute on bad signal
      if (mindwaveData.value.signal === 0) {
        playSound();
      } else {
        pause();
      }

      // first signal, actually begin
      if (cur.value.tick === 1) {
        cur.value.meditationStart = Date.now();

        // begin signal
        beep(freq);
      }

      // stop after max time
      if (store.state.settings.meditationTimeMax > 0 &&
        cur.value.meditationTime >= store.state.settings.meditationTimeMax
      ) {
        stopMeditation();
      }
    }

    // watch
    // watch(meditation, updateMeditation);
    watch(lastDataTime, (val) => {
      updateMeditation(mindwaveData.value.meditation);
    });

    watch(attention, (val, prev) => {
      if (!cur.value.meditationStart || cur.value.state === 'stop') return;
      processThresholds({ field: 'attention', value: val });
    });

    watch(signal, (val, prev) => {
      if (val === 0 || isNaN(val)) return;
      let freq = Math.min(val * 5, 200);
      // console.log('sig freq: ', freq);
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    });

    watch(isSound, (val, prev) => {
      if (cur.value.isPlay) {
        if (val) oscillator.connect(audioCtx.destination);
        else oscillator.disconnect(audioCtx.destination);
      }
    });













    // TODO: remove
    /*function meditationBrief(med: MeditationType) {
      return {
        name: med.name,
        startTime: med.meditationStart,
        durationTime: med.meditationTime,
        thresholdsData: med.thresholdsData,
      } as MeditationBriefType
    }*/

    // TODO: on app load
    function syncMeditations() {
      dbGet('meditations', (meds) => {
        // new from firebase
        const newMeds = meds.filter(med => {
          return !store.state.meditationsBrief.find(el => el.startTime === med.startTime);
        });

        if (newMeds.length > 0) {
          console.log('Update meditations from firebase:', newMeds);
          const synced = sortMediations([...store.state.meditationsBrief, ...newMeds])
          store.commit('meditationsBrief', synced);
        }

        const unsyncedHistory = Object
          .entries(store.state.meditationsData)
          .filter(en => !en[1].synced)
          .map(en => {
            console.log("en:", en);
            return {
              id: parseInt(en[0]),
              data: en[1].data
            }
          });
        if (unsyncedHistory.length > 0) {
          console.log("send meds:", unsyncedHistory);
          const cached = {...store.state.meditationsData};
          for (const item of unsyncedHistory) {
            setHistory(item.id, item.data);
            cached[item.id].synced = true;
          }
          store.commit('meditationsData', cached);
          dbSet('meditations', store.state.meditationsBrief);
        }
      });
    }

    function syncMeditationsForce() {
      store.state.meditationsBrief = [];
      store.state.meditationsData = {};
      syncMeditations();
    }

    // TODO: remove
    /*function convertMeditations() {
      const brief = store.state.meditations.map(med => {
        return meditationBrief(med);
      });
      dbSet('meditations', brief);
      store.commit('meditationsBrief', brief);
    }*/

    // TODO: remove
    /*function sendMeditationsData() {
      const data = {};
      for (const med of store.state.meditations) {
        data[med.meditationStart] = med.history;
      }
      dbSet('meditationsData', data);
    }*/

    onMounted(() => {
      console.log("meditationsData cache size:", Object.keys(store.state.meditationsData).length);
      console.log("meditationsData unsynced:", Object.entries(store.state.meditationsData).filter(e => !e[1].synced).length);

      // update mindwaveData
      setInterval(updateMindwaveData, 1000);

      // init app
      setTimeout(async () => {
        cur.value.state = 'before audioInit';
        await audioInit();

        cur.value.state = 'before start';
        startMeditation();
      }, 1000);

      // drawChartHistory();
    });


































    // TODO: The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page. https://goo.gl/7K7WLu
    // https://developer.chrome.com/blog/autoplay/#webaudio
    async function audioInit() {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      oscillator = audioCtx.createOscillator();
      oscillator.type = 'square';
      oscillator.start();
      audioCtx.resume(); // TODO: check on slow mobile network
    }

    function beep(freqAfter = 0, freq = 1000, time = 50) {
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      setTimeout(() => {
        oscillator.frequency.setValueAtTime(freqAfter, audioCtx.currentTime);
      }, time);
    }

    function playSound() {
      if (cur.value.isPlay) return;
      cur.value.isPlay = true;
      if (store.state.settings.isSound) oscillator.connect(audioCtx.destination);
    }

    function pause() {
      if (!cur.value.isPlay) return;
      cur.value.isPlay = false;
      if (store.state.settings.isSound) oscillator.disconnect(audioCtx.destination);
    }

    function startMeditation() {
      // stop
      if (cur.value.state === 'started') {
        stopMeditation();
        return;
      }

      // start
      cur.value.state = 'started';
      cur.value.meditationStart = Date.now();
      cur.value.history = [];
      cur.value.thresholdsData = {} as ThresholdsDataType;
      cur.value.tick = 0;
      cur.value.totalSum = 0;

      nosleep.enable();
    }

    function stopMeditation() {
      // this.meditationStart = 0;
      // this.meditationTime = 0;

      beep(0);
      setTimeout(pause, 2000);

      cur.value.state = 'stop';
      nosleep.disable();
    }

    function saveMeditation() {
      const d = new Date(cur.value.meditationStart).toISOString().replace('T', ' ').substring(0, 16);
      const name = cur.value.name || `${d}: ${mmss(cur.value.meditationTime)}`;
      const med: MeditationBriefType = {
        name: name,
        // history: cur.value.history, // слишком тяжёлые данные, надо сохранять отдельно
        startTime: cur.value.meditationStart,
        durationTime: cur.value.meditationTime,
        thresholdsData: cur.value.thresholdsData,
      };

      console.log('med: ', med);
      const meds = [...store.state.meditationsBrief, med];
      const sorted = sortMediations(meds);
      try {
        // console.log('add meditation to store.state.meditations');
        store.commit('meditationsBrief', sorted);
        dbSet('meditations', sorted).catch(() => {
          console.log("meditations not uploaded");
        });
        setHistory(med.startTime, cur.value.history);
      } catch (e) {
        alert('Not enough space for save meditation!');
      }
    }

    function sortMediations(meds: MeditationBriefType[]) {
      return meds.sort((b, a) => {
        if (a.startTime > b.startTime) return 1;
        if (a.startTime < b.startTime) return -1;
        return 0;
      });
    }

    function getHistory(id: number) {
      return new Promise((resolve, reject) => {
        if (store.state.meditationsData[id]) return resolve(store.state.meditationsData[id].data);
        dbGet(`meditationsData/${id}`, history => {
          if (history) resolve(history/* as MeditationDataType[]*/);
          else reject(history);
        });
      });
    }
    function setHistory(id: number, value: MeditationDataType[]) {
      const newData = {
        ...store.state.meditationsData,
        ...{ [id]: {
          synced: false,
          data:value
        } }
      }
      store.commit('meditationsData', newData);
      dbSet(`meditationsData/${id}`, value)
        .then(() => {
          const syncedData = {...store.state.meditationsData};
          syncedData[id].synced = true;
          store.commit('meditationsData', syncedData);
          console.log("synced");
          // removeHistory(id, true);
        })
        .catch(() => {
          console.log("history not synced");
        });
    }
    function removeHistory(id: number, onlyCached=false) {
      const newData = { ...store.state.meditationsData }
      delete(newData[id]);
      store.commit('meditationsData', newData);
      if (!onlyCached) dbRemove(`meditationsData/${id}`);
    }

    function loadMeditation(med: MeditationBriefType) {
      stopMeditation();
      // console.log('load meditation: ', med);
      getHistory(med.startTime).then(history => {
        // console.log("history:", history);
        cur.value.history = history;
      }).catch(() => {
        console.log("error load history");
        cur.value.history = [];
      });
      // cur.value.history = med.history;
      cur.value.thresholdsData = med.thresholdsData;
      cur.value.meditationStart = med.startTime;
      cur.value.meditationTime = med.durationTime;
      cur.value.name = med.name;
      drawChart();
      window.scrollTo(0, 0);
    }

    function compareMeditation(med: MeditationBriefType) {
      if (med.name === cur.value.meditationCompare.name) cur.value.meditationCompare = {};
      else {
        cur.value.meditationCompare = med;
        window.scrollTo(0, 0);
      }
    }

    function removeMeditation(med: MeditationBriefType) {
      const removed = store.state.meditationsBrief.filter((m) => m.name !== med.name);
      store.commit('meditationsBrief', removed);
      dbSet('meditations', removed);
      removeHistory(med.startTime);
    }

    function addHistory() {
      const data = {
        d: Date.now(),
        m: mindwaveData.value.meditation,
        a: mindwaveData.value.attention,
      };
      cur.value.history.push(data);
    }

    function processThresholds({ field, value }: {
      field: 'meditation' | 'attention', value: number
    }) {
      if (!cur.value.thresholdsData[field]) {
        cur.value.thresholdsData[field] = {
          totalSum: 0,
          tick: 0,
          average: 0,
          thresholds: {},
        };
      }

      // цикл по барьерам (70%, 80%, 90%)
      for (let threshold of thresholds.value) {
        if (!cur.value.thresholdsData[field].thresholds[threshold]) {
          cur.value.thresholdsData[field].thresholds[threshold] = {
            total: 0,
            loses: 0,
            start: 0,
          };
        }

        const th = cur.value.thresholdsData[field].thresholds[threshold];

        // start
        if (value >= threshold) {
          if (!th.start) {
            // console.log(`start meditation ${threshold}%`);
            cur.value.thresholdsData[field].thresholds[threshold].start = Date.now();
          }
        }

        // end
        if (value < threshold) {
          if (th.start) {
            // console.log(`stop meditation ${threshold}%`);
            if (!th.loses) th.loses = 0;
            if (!th.total) th.total = 0;
            if (!th.maxTime) th.maxTime = 0;

            th.loses++;

            const t = Math.round((Date.now() - th.start) / 1000);
            th.total += t;

            th.maxTime = Math.max(th.maxTime, t);
          }
          th.start = 0;

          cur.value.thresholdsData[field].thresholds[threshold] = th;
        }
      }

      cur.value.thresholdsData[field].tick++;
      cur.value.thresholdsData[field].totalSum += value;
      cur.value.thresholdsData[field].average = Math.round(
        cur.value.thresholdsData[field].totalSum / cur.value.thresholdsData[field].tick
      );
    }


    function drawChart() {
      // TODO: fire event
      // drawChartMeditation('svgMed', chartData);
    }

    function drawChartHistory(){

    }




    return () => (
      <div>
        <Profile/>

        <CurrentMeditation id="medCurrent" cur={cur} mindwaveData={mindwaveData}/>
        { cur.value.meditationCompare.name && (
          <CurrentMeditation id="medCompare" cur={cur.value.meditationCompare}/>
        )}

        <div class="mb-4">
          <ElButton onClick={startMeditation}>{cur.value.state === 'started' ? 'Stop' : 'Start'}</ElButton>
          {cur.value.state === 'stop' && <ElButton onClick={saveMeditation}>Save</ElButton>}
          {store.state.user && <ElButton onClick={syncMeditations}>Sync</ElButton>}
        </div>


        <Settings/>

        <DaysChart id="daysChart" days={days}/>

        <MeditationsList
          onLoad={loadMeditation}
          onRemove={removeMeditation}
          onCompare={compareMeditation}
        />
        <DaysList days={days}/>
        {/*<ElButton onClick={convertMeditations}>Convert med</ElButton>
        <ElButton onClick={sendMeditationsData}>Send to DB</ElButton>
        {store.state.user && <ElButton onClick={syncMeditationsForce}>Force sync</ElButton>}*/}
      </div>
    );
  },
});
