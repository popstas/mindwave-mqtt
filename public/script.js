async function start() {
  const config = {
    mindwaveUrl: 'http://localhost:9301/mindwave',
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
    fromDay: '', // 2021-09-20 начало 5-минутных медитаций
  };

  const nosleep = new NoSleep();

  // mutations с записью тупо значения в state
  const mutationFabric = (names) => {
    const mutations = {};
    names.map((name) => {
      mutations[name] = (state, val) => {
        state[name] = val;
      };
    });
    return mutations;
  };

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

  const store = new Vuex.Store({
    // ...
    plugins: [
      createPersistedState({
        paths: persistentFields,
      }),
    ],
    state: {
      isSound: true,
      halfChartTop: false,
      halfChartBottom: false,
      meditationZones: true,
      meditationTimeMax: 600,
      meditationFrom: 70,
      fromDay: config.fromDay,
      meditations: [],
    },
    mutations: {
      ...mutationFabric(persistentFields),
    },
  });

  // создаёт computed с геттером и сеттером из vuex
  const computedFabric = (names) => {
    const computed = {};
    names.map((name) => {
      computed[name] = {
        get() {
          return store.state[name];
        },
        set(val) {
          store.commit(name, val);
        },
      };
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
      meditationName: '',
      meditationCompare: {},

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
          thresholds.push(parseInt(this.meditationFrom));
          return thresholds.sort();
        }
        return thresholds;
      },

      chartData() {
        return this.historyToChartData(this.history);
      },
      chartDataCompare() {
        return this.historyToChartData(this.meditationCompare.history);
      },

      meditationNameWidth() {
        const padding = 3; // paddings and close button
        const width = (this.meditationName.length + 1) * 8 + padding;
        return Math.max(50, width);
      },

      meditationsStat() {
        const days = {};
        // console.log('this.meditations: ', this.meditations);

        let minDate, maxDate;

        // собирает days
        this.meditations.forEach((med) => {
          const day = this.day(med.meditationStart - 6 * 3600 * 1000); // до 6 утра считаем за вчера
          const date = new Date(day).getTime();
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
          ds.time += med.meditationTime;
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
          const day = this.day(date);
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
          if (this.fromDay && ds.date < new Date(this.fromDay)) continue; // limit From day

          // считаем средние
          for (let t of [70, 80, 90, 100]) {
            const keyTotal = 'med' + t + 'total';
            const keyAvg = 'med' + t + 'avg';
            ds[keyAvg] = (ds[keyTotal] / ds.time) * 100;
            if (isNaN(ds[keyAvg])) ds[keyAvg] = 0;
          }
          ds.day = day;

          // валидация
          ds.isMeditationHigh = ds.med70avg >= config.medLevels.high ? 100 : 0;
          ds.isMeditationMed =
            ds.med70avg >= config.medLevels.low && ds.med70avg < config.medLevels.high ? 100 : 0;
          ds.isMeditationLow = ds.med70avg < config.medLevels.low && ds.med70avg > 0 ? 100 : 0;
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
      },
    },

    watch: {
      attention(val) {
        if (!this.meditationStart || this.state === 'stop') return;
        this.processThresholds({ field: 'attention', value: val });
      },

      halfChartTop(val) {
        if (val) this.halfChartBottom = false;
        this.drawChart();
        this.drawChartHistory();
      },

      halfChartBottom(val) {
        if (val) this.halfChartTop = false;
        this.drawChart();
      },

      meditationZones() {
        this.drawChart();
        this.drawChartHistory();
      },

      fromDay() {
        this.drawChartHistory();
      },

      // пищит, когда нет сигнала
      signal(val) {
        // console.log(val);
        if (val === 0 || isNaN(val)) return;
        let freq = Math.min(val * 5, 200);
        // console.log('sig freq: ', freq);
        this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      },

      meditation(val) {
        // started meditation
        if (!this.meditationStart || this.state === 'stop') return;

        this.processThresholds({ field: 'meditation', value: val });

        // время сессии
        this.meditationTime = Math.round((Date.now() - this.meditationStart) / 1000);

        // среднее, только при хорошем сигнале
        // здесь по идее всегда сигнал 0
        if (this.signal === 0 && this.meditation > 0) {
          this.tick++;
          this.totalSum += val;
          this.addHistory();
          this.drawChart();
          this.drawChartHistory();
        }

        // звук
        let freq = 0;
        for (let threshold in config.thresholdsFrequency) {
          const f = config.thresholdsFrequency[threshold];
          if (val > threshold) freq = f;
        }
        // console.log('med freq: ', freq);
        this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        // mute on bad signal
        if (this.signal === 0) {
          this.playSound();
        } else {
          this.pause();
        }

        // first signal, actually begin
        if (this.tick === 1) {
          this.meditationStart = Date.now();

          // begin signal
          this.beep(freq);
        }

        // stop after max time
        if (this.meditationTimeMax > 0 && this.meditationTime >= this.meditationTimeMax) {
          this.stopMeditation();
        }
      },

      meditations() {
        this.drawChartHistory();
      },

      isSound(val) {
        if (this.isPlay) {
          if (val) this.oscillator.connect(this.audioCtx.destination);
          else this.oscillator.disconnect(this.audioCtx.destination);
        }
      },
    },

    mounted() {
      // this.convertHistory();

      setInterval(async () => {
        const headers = new Headers();

        const response = await fetch(config.mindwaveUrl, {
          headers: headers,
        });

        const data = await response.json();

        for (let name in data) {
          this[name] = parseInt(data[name]);
        }
      }, 1000);

      setTimeout(async () => {
        this.state = 'before audioInit';
        await this.audioInit();

        this.state = 'before start';
        this.startMeditation();
      }, 1000);

      this.drawChartHistory();
    },

    methods: {
      beep(freqAfter, freq = 1000, time = 50) {
        this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        setTimeout(() => {
          this.oscillator.frequency.setValueAtTime(freqAfter, this.audioCtx.currentTime);
        }, time);
      },

      historyToChartData(history) {
        return history.map((elem) => {
          // расшифровываем сокращённый json
          const med = elem.m || elem.values.mediation;
          const att = elem.a || elem.values.attention;
          const date = elem.d || elem.date;

          const isMed = med >= this.meditationFrom ? 100 : 0;

          const seconds = Math.round((date - this.meditationStart) / 1000);

          return {
            date: date - this.meditationStart,
            value: med,
            meditation: med,
            isMeditationHigh: isMed,
            isMeditationMed: med >= config.medLevels.low && med < this.meditationFrom ? 100 : 0,
            isMeditationLow: med < config.medLevels.low ? 100 : 0,
            isMeditation80: med >= 80 ? 100 : 0,
            isMeditation90: med >= 90 ? 100 : 0,
            isMeditation100: med >= 100 ? 100 : 0,
            isMinute: seconds > 0 && seconds % 60 === 0 ? 100 : 0,
            attention: att,
          };
        });
      },

      async audioInit() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.start();
        this.audioCtx.resume(); // TODO: check on slow mobile network
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
        // this.meditationStart = 0;
        // this.meditationTime = 0;

        this.beep(0);
        setTimeout(this.pause, 2000);

        this.state = 'stop';
        nosleep.disable();
      },

      startMeditation() {
        // stop
        if (this.state === 'started') {
          this.stopMeditation();
          return;
        }

        // start
        this.state = 'started';
        this.meditationStart = Date.now();
        this.thresholdsData = {};
        this.tick = 0;
        this.totalSum = 0;
        this.history = [];
        nosleep.enable();
      },

      saveMeditation() {
        const d = new Date(this.meditationStart).toISOString().replace('T', ' ').substring(0, 16);
        const name = this.meditationName || `${d}: ${this.mmss(this.meditationTime)}`;
        const med = {
          name: name,
          history: this.history, // TODO: слишком тяжёлые данные, надо сохранять отдельно
          thresholdsData: this.thresholdsData,
          meditationStart: this.meditationStart,
          meditationTime: this.meditationTime,
        };

        const meds = [...this.meditations, med];
        const sorted = meds.sort((b, a) => {
          if (a.meditationStart > b.meditationStart) return 1;
          if (a.meditationStart < b.meditationStart) return -1;
          return 0;
        });
        try {
          this.meditations = sorted;
        } catch (e) {
          alert('Not enough space for save meditation!');
        }
      },

      loadMeditation(med) { 
        this.history = med.history;
        this.thresholdsData = med.thresholdsData;
        this.meditationStart = med.meditationStart;
        this.meditationTime = med.meditationTime;
        this.meditationName = med.name;
        this.drawChart();
        window.scrollTo(0, 0);
      },

      compareMeditation(med) {
        if (med.name === this.meditationCompare.name) this.meditationCompare = {};
        else {
          this.meditationCompare = med;
          this.drawChartMeditation('svgMedCompare', this.chartDataCompare);
          window.scrollTo(0, 0);
        }
      },

      removeMeditation(med) {
        this.meditations = this.meditations.filter((m) => m.name !== med.name);
      },

      processThresholds({ field, value }) {
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
              // console.log(`start meditation ${threshold}%`);
              this.thresholdsData[field].thresholds[threshold].start = Date.now();
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

            this.thresholdsData[field].thresholds[threshold] = th;
          }
        }

        this.thresholdsData[field].tick++;
        this.thresholdsData[field].totalSum += value;
        this.thresholdsData[field].average = Math.round(
          this.thresholdsData[field].totalSum / this.thresholdsData[field].tick
        );
      },

      mmss(s) {
        const sec = String(s % 60).padStart(2, '0');
        const min = String(Math.floor(s / 60)).padStart(2, ' ');
        return `${min}:${sec}`;
      },

      // yyyy-mm-dd hh:mm
      dateTime(ts) {
        if (!ts) return '';
        ts += new Date().getTimezoneOffset() * -60 * 1000;
        return new Date(ts).toISOString().replace('T', ' ').substring(0, 16);
      },

      // yyyy-mm-dd
      day(ts) {
        if (!ts) return '';
        ts += new Date().getTimezoneOffset() * -60 * 1000;
        return new Date(ts).toISOString().replace('T', ' ').substring(0, 10);
      },

      timePercent(time) {
        const val = Math.round((time / this.meditationTime) * 100);
        return `${val}%`;
      },

      addHistory() {
        const data = {
          d: Date.now(),
          m: this.meditation,
          a: this.attention,
        };
        this.history.push(data);
      },

      clientWidth() {
        return window.innerWidth > 0 ? window.innerWidth : screen.width;
      },

      clientHeight() {
        return window.innerHeight > 0 ? window.innerHeight : screen.height;
      },

      percentClass(val, type) {
        if (`${val}`.match(/%$/)) val = parseInt(val);

        if (type === 'meditation70') {
          if (val >= this.meditationFrom) return 'percent-highest';
          if (val >= config.medLevels.high) return 'percent-high';
          if (val > config.medLevels.low) return 'percent-mid';
          if (val > 0) return 'percent-low';
        }

        if (type === 'meditation') {
          if (val >= 80) return 'percent-bold-big';
          if (val >= 68) return 'percent-bold';
          // if (val > 60) return 'percent-mid';
          // return 'percent-low';
        }
      },

      drawChart() {
        this.drawChartMeditation('svgMed', this.chartData);
      },

      drawChartMeditation(svgId, chartData) {
        const width = this.clientWidth(); // 100% ширины
        const height = Math.max(this.clientHeight() / 3, 300); // 300 точек или 1/3 высоты экрана: что больше
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        this.$refs[svgId].setAttribute('width', width);
        this.$refs[svgId].setAttribute('height', height);
        // console.log('this.chartData.length: ', this.chartData.length);

        const chartFrom = this.halfChartTop ? 72 : 10; // если поставить 0, то будет с -10
        const chartTo = this.halfChartBottom ? 30 : 100;

        const lineByIndicator = (name) => {
          return d3
            .line()
            .defined((d) => !isNaN(d[name]))
            .x((d) => x(d.date))
            .y((d) => y(d[name]))
            .curve(d3.curveStep);
        };

        const areaByIndicator = (name) => {
          return (
            d3
              .area()
              .defined((d) => !isNaN(d[name]))
              .x((d) => x(d.date))
              .y0(height)
              // .y1(d => y(d[name]))
              .y1((d) => y(d[name]))
              .curve(d3.curveStep)
          );
        };

        const lineThreshold = ({ name, value }) => {
          return d3
            .line()
            .defined((d) => !isNaN(d.meditation))
            .x((d) => x(d.date))
            .y((d) => y(value));
        };

        const xAxis = (g) =>
          g.attr('transform', `translate(0,${height - margin.bottom})`).call(
            d3
              .axisBottom(x)
              .ticks(width / 80)
              .tickSizeOuter(0)
              .tickFormat(d3.timeFormat('%M:%S'))
          );

        const yAxis = (g) =>
          g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call((g) => g.select('.domain').remove())
            .call((g) =>
              g
                .select('.tick:last-of-type text')
                .clone()
                .attr('x', 3)
                .attr('text-anchor', 'start')
                .attr('font-weight', 'bold')
            );

        const x = d3
          .scaleUtc()
          .domain(d3.extent(chartData, (d) => d.date))
          .range([margin.left, width - margin.right]);

        const y = d3
          .scaleLinear()
          .domain([chartFrom, chartTo])
          .nice()
          .range([height - margin.bottom, margin.top]);

        const svg = d3.select('#' + svgId);
        svg.selectAll('*').remove();

        svg.attr('viewBox', [0, 0, width, height]);

        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // meditation
        svg
          .append('path')
          .datum(chartData)
          .attr('fill', 'steelblue')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 1.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', areaByIndicator('meditation'));

        // attention
        svg
          .append('path')
          .datum(chartData)
          .attr('fill', 'none')
          .attr('stroke', '#999')
          .attr('stroke-width', 1.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', lineByIndicator('attention'));

        // isMeditationHigh
        if (this.meditationZones) {
          svg
            .append('path')
            .datum(chartData)
            .attr('fill', 'green')
            .attr('stroke', 'green')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditationHigh'));
          svg
            .append('path')
            .datum(chartData)
            .attr('fill', 'green')
            .attr('stroke', 'green')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditation80'));
          svg
            .append('path')
            .datum(chartData)
            .attr('fill', 'green')
            .attr('stroke', 'green')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditation90'));
          svg
            .append('path')
            .datum(chartData)
            .attr('fill', 'green')
            .attr('stroke', 'green')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditation100'));

          // isMeditationMed
          svg
            .append('path')
            .datum(chartData)
            .attr('fill', 'yellow')
            .attr('stroke', 'yellow')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditationMed'));

          // isMeditationMed
          svg
            .append('path')
            .datum(chartData)
            .attr('fill', 'red')
            .attr('stroke', 'red')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditationLow'));

          // minute checkpoint TODO:
          svg
            .append('path')
            .datum(chartData)
            .attr('fill', 'white')
            .attr('stroke', 'white')
            .attr('opacity', '0.9')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMinute'));
        }

        // this.meditationFrom
        svg
          .append('path')
          .datum(chartData)
          .attr('stroke', 'green')
          .style('stroke-dasharray', '5, 5')
          .attr(
            'd',
            lineThreshold({ name: this.meditationFrom + '%', value: this.meditationFrom })
          );

        // 80%
        svg
          .append('path')
          .datum(chartData)
          .attr('stroke', 'green')
          .style('stroke-dasharray', '5, 5')
          .attr('d', lineThreshold({ name: '80%', value: 80 }));

        // 90%
        svg
          .append('path')
          .datum(chartData)
          .attr('stroke', 'green')
          .style('stroke-dasharray', '5, 5')
          .attr('d', lineThreshold({ name: '90%', value: 90 }));

        // 100%
        svg
          .append('path')
          .datum(chartData)
          .attr('stroke', 'green')
          .style('stroke-dasharray', '5, 5')
          .attr('d', lineThreshold({ name: '100%', value: 100 }));
      },

      drawChartHistory() {
        const width = this.clientWidth(); // 100% ширины
        const height = Math.max(this.clientHeight() / 3, 300); // 300 точек или 1/3 высоты экрана: что больше
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        this.$refs.svgHistory.setAttribute('width', width);
        this.$refs.svgHistory.setAttribute('height', height);
        // console.log('this.meditationsStat.length: ', this.meditationsStat.length);

        const chartFrom = this.halfChartTop ? 50 : 10; // если поставить 0, то будет с -10
        const chartTo = 100;

        const lineByIndicator = (name) => {
          return d3
            .line()
            .defined((d) => !isNaN(d[name]))
            .x((d) => x(d.date))
            .y((d) => y(d[name]))
            .curve(d3.curveStep);
        };

        const areaByIndicator = (name) => {
          return (
            d3
              .area()
              .defined((d) => !isNaN(d[name]))
              .x((d) => x(d.date))
              .y0(height)
              // .y1(d => y(d[name]))
              .y1((d) => y(d[name]))
              .curve(d3.curveStep)
          );
        };

        const lineThreshold = ({ name, value }) => {
          return d3
            .line()
            .defined((d) => !isNaN(d.meditation))
            .x((d) => x(d.date))
            .y((d) => y(value));
        };

        const xAxis = (g) =>
          g.attr('transform', `translate(0,${height - margin.bottom})`).call(
            d3
              .axisBottom(x)
              .ticks(width / 80)
              .tickSizeOuter(0)
              .tickFormat(d3.timeFormat('%M:%S'))
          );

        const yAxis = (g) =>
          g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call((g) => g.select('.domain').remove())
            .call((g) =>
              g
                .select('.tick:last-of-type text')
                .clone()
                .attr('x', 3)
                .attr('text-anchor', 'start')
                .attr('font-weight', 'bold')
            );

        const x = d3
          .scaleUtc()
          .domain(d3.extent(this.meditationsStat, (d) => d.date))
          .range([margin.left, width - margin.right]);

        const y = d3
          .scaleLinear()
          .domain([chartFrom, chartTo])
          .nice()
          .range([height - margin.bottom, margin.top]);

        const svg = d3.select('#svgHistory');
        svg.selectAll('*').remove();

        svg.attr('viewBox', [0, 0, width, height]);

        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // med70total
        svg
          .append('path')
          .datum(this.meditationsStat)
          .attr('fill', 'steelblue')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 1.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', areaByIndicator('med70totalPoints'));

        // med80avg
        /* svg.append("path")
          .datum(this.meditationsStat)
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 1.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", lineByIndicator('med80avg')) */

        // med90avg
        /* svg.append("path")
          .datum(this.meditationsStat)
          .attr("fill", "none")
          .attr("stroke", "green")
          .attr("stroke-width", 1.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", lineByIndicator('med90avg')) */

        // mins
        svg
          .append('path')
          .datum(this.meditationsStat)
          .attr('fill', 'none')
          .attr('stroke', 'white')
          .attr('stroke-width', 1.5)
          // .attr("stroke-linejoin", "round")
          // .attr("stroke-linecap", "round")
          .attr('d', lineByIndicator('mins'));

        // isMeditationHigh
        if (this.meditationZones) {
          svg
            .append('path')
            .datum(this.meditationsStat)
            .attr('fill', 'green')
            .attr('stroke', 'green')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditationHigh'));

          // isMeditationMed
          svg
            .append('path')
            .datum(this.meditationsStat)
            .attr('fill', 'yellow')
            .attr('stroke', 'yellow')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditationMed'));

          // isMeditationMed
          svg
            .append('path')
            .datum(this.meditationsStat)
            .attr('fill', 'red')
            .attr('stroke', 'red')
            .attr('opacity', '0.3')
            .attr('stroke-width', 0)
            .attr('d', areaByIndicator('isMeditationLow'));
        }

        // 50%
        svg
          .append('path')
          .datum(this.meditationsStat)
          .attr('stroke', 'yellow')
          .style('stroke-dasharray', '5, 5')
          .attr(
            'd',
            lineThreshold({ name: `${config.medLevels.high}%`, value: config.medLevels.high })
          );

        // 40%
        svg
          .append('path')
          .datum(this.meditationsStat)
          .attr('stroke', 'red')
          .style('stroke-dasharray', '5, 5')
          .attr(
            'd',
            lineThreshold({ name: `${config.medLevels.low}%`, value: config.medLevels.low })
          );

        // 30%
        /* svg.append("path")
          .datum(this.meditationsStat)
          .attr("stroke", "red")
          .style("stroke-dasharray", ("5, 5"))
          .attr("d", lineThreshold({name: '30%', value: 30})) */

        // med70avg
        svg
          .append('path')
          .datum(this.meditationsStat)
          .attr('fill', 'none')
          .attr('stroke', 'green')
          .attr('stroke-width', 1.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', lineByIndicator('med70avg'));
      },
    },
  });
}

window.onload = start;
