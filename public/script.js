async function start() {
  const resp = await fetch('https://private.popstas.ru/mindwave-mqtt.config.json');
  const config = await resp.json();

  // mutations с записью тупо значения в state
  const mutationFabric = (names) => {
    const mutations = {};
    names.map(name => {
      mutations[name] = (state, val) => {
        state[name] = val;
      }
    });
    return mutations;
  };

  const persistentFields = [
    'isSound',
    'halfChart',
    'meditationFrom',
    'soundFrequency',
  ];

  const store = new Vuex.Store({
    // ...
    plugins: [createPersistedState({
      paths: persistentFields,
    })],
    state: {
      isSound: true,
      halfChart: true,
      meditationFrom: 70,
      soundFrequency: 5,
    },
    mutations: {
      ...mutationFabric(persistentFields),
    }
  });

  // создаёт computed с геттером и сеттером из vuex
  const computedFabric = (names) => {
    const computed = {};
    names.map(name => {
      computed[name] = {
        get() { return store.state[name]; },
        set(val) { store.commit(name, val); }
      }
    });

    return computed;
  };

  const app = new Vue({
    store,
    el: '#app',
    components: {
      // D3BarChart,
    },

    data: {
      meditationStart: Date.now(),
      meditationTime: 0,
      history: [],
      thresholdsData: {},

      // app state
      state: 'idle',
      audioCtx: null,
      meditation: '',
      attention: '',
      lowAlpha: '',
      highAlpha: '',
      lowBeta: '',
      highBeta: '',
      lowGamma: '',
      highGamma: '',
      signal: '',
    },

    computed: {
      ...computedFabric(persistentFields),

      thresholds() {
        const thresholds = [70, 80, 90, 100];
        if (!thresholds.includes(this.meditationFrom)) {
          thresholds.push(parseInt(this.meditationFrom))
          return thresholds.sort();
        }
        return thresholds;
      },

      chartData() {
        return this.history.map(elem => {
          return {
            date: elem.date - this.meditationStart,
            value: elem.values.meditation,
            meditation: elem.values.meditation,
            attention: elem.values.attention,
          }
        });
      },
    },

    watch: {
      attention(val) {
        this.processThresholds({field: 'attention', value: val});
      },

      meditation(val) {
        // started meditation
        if (!this.meditationStart || this.state == 'stop') return;

        this.processThresholds({field: 'meditation', value: val});
        // console.log('this.thresholdsData: ', this.thresholdsData);

        // время сессии
        this.meditationTime = Math.round((Date.now() - this.meditationStart) / 1000);

        // среднее, только при хорошем сигнале
        if (this.signal == 0 && this.meditation > 0){
          this.tick++;
          this.totalSum += val;
          this.meditationAverage = Math.round(this.totalSum / this.tick);
          this.addHistory();
          this.drawChart();
        }

        // sound
        const thresholdsFrequency = {
          0: 2,
          70: 1,
          80: 0,
          90: 0,
          100: 0,
        }

        let freq = 0;
        for (let threshold in thresholdsFrequency) {
          const f = thresholdsFrequency[threshold];
          if (val > threshold) freq = f;
        }
        console.log('freq: ', freq); 
        this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        this.playSound();
        /* if (val < this.meditationFrom) this.playSound();
        else this.pause(); */
      },

      isSound(val) {
        if (this.isPlay) {
          if (val) this.oscillator.connect(this.audioCtx.destination);
          else this.oscillator.disconnect(this.audioCtx.destination);
        }
      },

    },

    mounted() {
      setInterval(async () => {
        const headers = new Headers();
        const userPass = base64.encode(`${config.nodeRed.username}:${config.nodeRed.password}`);
        headers.set('Authorization', 'Basic ' + userPass);
    
        const response = await fetch(config.nodeRed.mindwaveUrl, {
          headers: headers,
        });
        
        const data = await response.json();

        for (let name in data) {
          this[name] = parseInt(data[name]);
        }
      }, 1000);

      this.audioInit();

      this.startMeditation();
    },

    methods: {
      audioInit() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.start();
      },

      play() {
        if (this.isPlay) return;
        this.tick = 0;
        this.totalSum = 0;
        this.history = [];
      },

      playSound() {
        if (this.isPlay) return;
        this.isPlay = true;
        if (this.isSound) this.oscillator.connect(this.audioCtx.destination);
      },

      pause() {
        if (!this.isPlay) return;
        this.isPlay = false;
        if (this.isSound) this.oscillator.disconnect(this.audioCtx.destination);
      },

      stopMeditation() {
        this.meditationStart = 0;
        // this.meditationTime = 0;
        this.pause();
        this.state = 'stop';
      },

      async startMeditation() {
        // stop
        if (this.state == 'started') {
          this.stopMeditation();
          return;
        }

        // start
        this.meditationStart = Date.now();
        this.thresholdsData = {};

        // create Oscillator node
        this.oscillator.type = 'square';
        this.play();

        await this.audioCtx.resume();

        this.state = 'started';
      },

      processThresholds({field, value}) {
        if (!this.thresholdsData[field]) {
          this.thresholdsData[field] = {
            totalSum: 0,
            tick: 0,
            average: 0,
            thresholds: {},
          };
        }

        // цикл по барьерам (70%, 80%, 90%)
        for (let threshold of this.thresholds) {
          if (!this.thresholdsData[field].thresholds[threshold]) {
            this.thresholdsData[field].thresholds[threshold] = {
              total: 0,
              loses: 0,
            };
          }
          
          const th = this.thresholdsData[field].thresholds[threshold];

          // start
          if (value >= threshold) {
            if (!th.start) {
              console.log(`start meditation ${threshold}%`);
              this.thresholdsData[field].thresholds[threshold].start = Date.now()
            }
          }

          // end
          if (value < threshold) {
            if (th.start) {
              console.log(`stop meditation ${threshold}%`);
              if (!th.loses) th.loses = 0;
              if (!th.total) th.total = 0;
              if (!th.maxTime) th.maxTime = 0;

              th.loses++;

              const t = Math.round((Date.now() - th.start) / 1000);
              th.total += t;

              th.maxTime = Math.max(th.maxTime, t);
            }
            th.start = 0;

            this.thresholdsData[field].thresholds[threshold] = th;
          }
        }

        this.thresholdsData[field].tick++;
        this.thresholdsData[field].totalSum += value;
        this.thresholdsData[field].average = Math.round(this.thresholdsData[field].totalSum / this.thresholdsData[field].tick);
      },

      mmss(s) {
        const sec = String(s % 60).padStart(2, '0');
        const min = String(Math.floor(s / 60)).padStart(2, ' ');
        return `${min}:${sec}`;
      }, 

      timePercent(time) {
        const val = Math.round(time / this.meditationTime * 100);
        return `${val}%`;
      },

      addHistory() {
        const data = {
          date: Date.now()/*  - this.meditationStart */,
          values: {
            meditation: this.meditation,
            attention: this.attention,
          }
        }
        this.history.push(data);
      },
  
      drawChart() {
        const width = this.clientWidth();
        const height = 300;
        const margin = ({top: 20, right: 30, bottom: 30, left: 40});
        this.$refs.svg.setAttribute('width', width);
        // console.log('this.chartData.length: ', this.chartData.length);

        const lineByIndicator = (name) => {
          return d3.line()
            .defined(d => !isNaN(d[name]))
            .x(d => x(d.date))
            .y(d => y(d[name]))
            .curve(d3.curveNatural)
        };

        const lineThreshold = ({name, value}) => {
          return d3.line()
            .defined(d => !isNaN(d.meditation))
            .x(d => x(d.date))
            .y(d => y(value));
        };

        const xAxis = g => g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(
            d3.axisBottom(x)
              .ticks(width / 80)
              .tickSizeOuter(0)
              .tickFormat(d3.timeFormat('%M:%S'))
          )

        const yAxis = g => g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select(".domain").remove())
          .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            );

        const x = d3.scaleUtc()
          .domain(d3.extent(this.chartData, d => d.date))
          .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
          .domain([this.halfChart ? 70 : 0, 100]).nice()
          .range([height - margin.bottom, margin.top]);

        const svg = d3.select("svg");
        svg.selectAll('*').remove()

        svg.attr("viewBox", [0, 0, width, height]);

        svg.append("g")
          .call(xAxis);
        svg.append("g")
          .call(yAxis);

        // meditation
        svg.append("path")
          .datum(this.chartData) 
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", lineByIndicator('meditation'))

        // attention
        svg.append("path")
          .datum(this.chartData)
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 1.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", lineByIndicator('attention'))

        // 80%
        svg.append("path")
          .datum(this.chartData)
          .attr("stroke", "green")
          .style("stroke-dasharray", ("5, 5"))
          .attr("d", lineThreshold({name: '80%', value: 80}))

        // 80%
        svg.append("path")
          .datum(this.chartData)
          .attr("stroke", "green")
          .style("stroke-dasharray", ("5, 5"))
          .attr("d", lineThreshold({name: '90%', value: 90}))

        // 100%
        svg.append("path")
          .datum(this.chartData)
          .attr("stroke", "green")
          .style("stroke-dasharray", ("5, 5"))
          .attr("d", lineThreshold({name: '100%', value: 100}))
      },

      clientWidth() {
        return (window.innerWidth > 0) ? window.innerWidth : screen.width;
      },
    },
  })
}

window.onload = start;
