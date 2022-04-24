import { defineComponent, computed, PropType, toRefs, onMounted, watch } from 'vue';
import { MeditationType } from '@/helpers/types';
import useStore from '@/helpers/useStore';
import { clientWidth, clientHeight } from '@/helpers/utils'
import * as d3 from 'd3'

export default defineComponent({
  name: 'MeditationChart',
  props: {
    id: String,
    med: { type: Object as PropType<MeditationType>, required: true },
  },
  setup(props) {
    const { id, med } = toRefs(props);
    const store = useStore();
    const chartData = computed(() => {
      // console.log(`MeditationChart ${props.id} med.value.meditation: `, med.value?.meditation);
      return historyToChartData(med.value?.history);
    });

    const width = clientWidth(); // 100% ширины
    const height = Math.max(clientHeight() / 3, 300); // 300 точек или 1/3 высоты экрана: что больше

    const halfChartTop = computed(() => store.state.settings.halfChartTop);
    const halfChartBottom = computed(() => store.state.settings.halfChartBottom);
    const meditationZones = computed(() => store.state.settings.meditationZones);

    watch([chartData, halfChartTop, halfChartBottom, meditationZones], (val) => {
      // console.log('chartData: ', chartData);
      drawChartMeditation(props.id, chartData.value);
    });

    onMounted(() => {});

    function historyToChartData(history) {
      if (!history) return [];
      // console.log('historyToChartData: ', history);
      return history.map((elem) => {
        // расшифровываем сокращённый json
        const m = elem.m || elem.values.mediation;
        const att = elem.a || elem.values.attention;
        const date = elem.d || elem.date;

        const isMed = m >= store.state.settings.meditationFrom ? 100 : 0;

        const seconds = Math.round((date - med.value.meditationStart) / 1000);

        return {
          date: date - med.value.meditationStart,
          value: m,
          meditation: m,
          isMeditationHigh: isMed,
          isMeditationMed:
            m >= store.state.medLevels.low && m < store.state.settings.meditationFrom ? 100 : 0,
          isMeditationLow: m < store.state.medLevels.low ? 100 : 0,
          isMeditation80: m >= 80 ? 100 : 0,
          isMeditation90: m >= 90 ? 100 : 0,
          isMeditation100: m >= 100 ? 100 : 0,
          isMinute: seconds > 0 && seconds % 60 === 0 ? 100 : 0,
          attention: att,
        };
      });
    }

    function drawChartMeditation(svgId, chartData) {
      // console.log('svgId: ', svgId);
      // console.log('chartData: ', chartData);
      if (chartData.length === 0) return;

      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      // this.$refs[svgId].setAttribute('width', width); // TODO:
      // this.$refs[svgId].setAttribute('height', height); // TODO:
      // console.log('this.chartData.length: ', this.chartData.length);

      const chartFrom = store.state.settings.halfChartTop ? 72 : 10; // если поставить 0, то будет с -10
      const chartTo = store.state.settings.halfChartBottom ? 30 : 100;

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
      if (store.state.settings.meditationZones) {
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

        // isMeditationLow
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
        .attr('d', lineThreshold({ name: store.state.settings.meditationFrom + '%', value: store.state.settings.meditationFrom }));

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
    }

    return () => <svg id={props.id} width={width} height={height}></svg>;
  },
});
