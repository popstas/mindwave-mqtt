import { defineComponent, onMounted, ref, watch, computed } from 'vue';
import useStore from '@/helpers/useStore';
import Settings from '@/components/Settings';
import CurrentMeditation from '@/components/CurrentMeditation';
import MeditationsList from '@/components/MeditationsList';
import DaysList from '@/components/DaysList';
import NoSleep from 'nosleep.js';

export default defineComponent({
  name: 'MainPage',
  setup(props, context) {
    const store = useStore();

    const nosleep = new NoSleep();
    console.log('store:', store);
    console.log('props:', props);

    // sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator; // for audioInit
















    const cur = ref({
      meditationStart: Date.now(),
      meditationTime: 0,
      history: [],
      thresholdsData: {},
      meditationName: '',
      tick: 0,
      totalSum: 0,

      meditationCompare: {},
      state: 'idle',
      isPlay: false,
    });

    const state = ref('stop');

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
















    onMounted(() => {
      // update mindwaveData
      setInterval(async () => {
        const headers = new Headers();

        const response = await fetch(store.state.mindwaveUrl, {
          headers: headers,
        });

        const data = await response.json();

        console.log('mindwaveData: ', mindwaveData);
        for (let name in data) {
          console.log(`mindwaveData[${name}]:`, mindwaveData[name]);
          mindwaveData.value[name] = parseInt(data[name]);
        }
      }, 1000);

      // init app
      setTimeout(async () => {
        cur.state = 'before audioInit';
        await audioInit();

        cur.state = 'before start';
        startMeditation();
      }, 1000);

      // drawChartHistory();
    });
















    // computed
    /* const meditationNameWidth = computed(() => {
      const padding = 3; // paddings and close button
      const width = (cur.meditationName.length + 1) * 8 + padding;
      return Math.max(50, width);
    }); */



















    async function audioInit() {
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
      if (cur.isPlay) return;
      cur.isPlay = true;
      if (store.state.isSound) oscillator.connect(audioCtx.destination);
    }

    function pause() {
      if (!cur.isPlay) return;
      cur.isPlay = false;
      if (store.state.isSound) oscillator.disconnect(audioCtx.destination);
    }

    function mmss(s: number) {
      const sec = String(s % 60).padStart(2, '0');
      const min = String(Math.floor(s / 60)).padStart(2, ' ');
      return `${min}:${sec}`;
    }

    // yyyy-mm-dd hh:mm
    function dateTime(ts: number) {
      if (!ts) return '';
      ts += new Date().getTimezoneOffset() * -60 * 1000;
      return new Date(ts).toISOString().replace('T', ' ').substring(0, 16);
    }

    // yyyy-mm-dd
    function day(ts: number) {
      if (!ts) return '';
      ts += new Date().getTimezoneOffset() * -60 * 1000;
      return new Date(ts).toISOString().replace('T', ' ').substring(0, 10);
    }

    function timePercent(time: number) {
      const val = Math.round((time / cur.meditationTime) * 100);
      return `${val}%`;
    }

    function startMeditation() {
      // stop
      if (state.value === 'started') {
        stopMeditation();
        return;
      }

      // start
      state.value = 'started';
      cur.meditationStart = Date.now();
      cur.history = [];
      cur.thresholdsData = {};
      cur.tick = 0;
      cur.totalSum = 0;

      nosleep.enable();
    }

    function stopMeditation() {
      // this.meditationStart = 0;
      // this.meditationTime = 0;

      beep(0);
      setTimeout(pause, 2000);

      state.value = 'stop';
      nosleep.disable();
    }

    function saveMeditation() {
      const d = new Date(cur.meditationStart).toISOString().replace('T', ' ').substring(0, 16);
      const name = cur.meditationName || `${d}: ${mmss(cur.meditationTime)}`;
      const med = {
        name: name,
        history: cur.history, // TODO: слишком тяжёлые данные, надо сохранять отдельно
        thresholdsData: cur.thresholdsData,
        meditationStart: cur.meditationStart,
        meditationTime: cur.meditationTime,
      };

      const meds = [...store.state.meditations, med];
      const sorted = meds.sort((b, a) => {
        if (a.meditationStart > b.meditationStart) return 1;
        if (a.meditationStart < b.meditationStart) return -1;
        return 0;
      });
      try {
        store.state.meditations = sorted;
      } catch (e) {
        alert('Not enough space for save meditation!');
      }
    }

    function loadMeditation(med) {
      cur.history = med.history;
      cur.thresholdsData = med.thresholdsData;
      cur.meditationStart = med.meditationStart;
      cur.meditationTime = med.meditationTime;
      cur.meditationName = med.name;
      // this.drawChart();
      window.scrollTo(0, 0);
    }

    function addHistory() {
      const data = {
        d: Date.now(),
        m: mindwaveData.meditation,
        a: mindwaveData.attention,
      };
      cur.history.push(data);
    }

    return () => (
      <div>
        <div>Meditation index: { mindwaveData.value.meditation }</div>
        <CurrentMeditation cur={cur} mindwaveData={mindwaveData}></CurrentMeditation>

        <button onClick={startMeditation}>{state.value === 'started' ? 'Stop' : 'Start'}</button>
        {cur.state === 'stop' && <button onClick={saveMeditation}>Save</button>}

        <Settings></Settings>

        <MeditationsList></MeditationsList>
        <DaysList></DaysList>
      </div>
    );
  },
});
