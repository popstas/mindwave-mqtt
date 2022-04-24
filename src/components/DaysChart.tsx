import { defineComponent, computed, toRefs, watch } from 'vue';
import useStore from '@/helpers/useStore';
import { clientWidth, clientHeight } from '@/helpers/utils'
import * as d3 from 'd3'

export default defineComponent({
  name: 'DaysChart',
  props: {
    id: String,
    days: Object,
  },
  setup(props) {
    const { id, days } = toRefs(props);
    const store = useStore();
    // console.log('days: ', days);

    const width = clientWidth(); // 100% ширины
    const height = Math.max(clientHeight() / 3, 300); // 300 точек или 1/3 высоты экрана: что больше

    const meditationZones = computed(() => store.state.settings.meditationZones);
    const fromDay = computed(() => store.state.settings.fromDay);

    watch([days, meditationZones, fromDay], (val) => {
      // console.log('chartData: ', chartData);
      drawChartHistory(props.id, days.value);
    });
    setTimeout(() => {
      // TODO: это костыль, тут реактивность не сработала
      drawChartHistory(props.id, days.value);
    }, 1000);

    function drawChartHistory(svgId, chartData) {
      // console.log('chartData: ', chartData);
      if (chartData.length === 0) return;

      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      // this.$refs.svgHistory.setAttribute('width', width);
      // this.$refs.svgHistory.setAttribute('height', height);
      // console.log('chartData.length: ', chartData.length);

      const chartFrom = store.state.settings.halfChartTop ? 50 : 10; // если поставить 0, то будет с -10
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

      // med70total
      svg
        .append('path')
        .datum(chartData)
        .attr('fill', 'steelblue')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', areaByIndicator('med70totalPoints'));

      // med80avg
      /* svg.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", lineByIndicator('med80avg')) */

      // med90avg
      /* svg.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", lineByIndicator('med90avg')) */

      // mins
      svg
        .append('path')
        .datum(chartData)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        // .attr("stroke-linejoin", "round")
        // .attr("stroke-linecap", "round")
        .attr('d', lineByIndicator('mins'));

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
      }

      // 50%
      svg
        .append('path')
        .datum(chartData)
        .attr('stroke', 'yellow')
        .style('stroke-dasharray', '5, 5')
        .attr(
          'd',
          lineThreshold({ name: `${store.state.medLevels.high}%`, value: store.state.medLevels.high })
        );

      // 40%
      svg
        .append('path')
        .datum(chartData)
        .attr('stroke', 'red')
        .style('stroke-dasharray', '5, 5')
        .attr(
          'd',
          lineThreshold({ name: `${store.state.medLevels.low}%`, value: store.state.medLevels.low })
        );

      // 30%
      /* svg.append("path")
        .datum(chartData)
        .attr("stroke", "red")
        .style("stroke-dasharray", ("5, 5"))
        .attr("d", lineThreshold({name: '30%', value: 30})) */

      // med70avg
      svg
        .append('path')
        .datum(chartData)
        .attr('fill', 'none')
        .attr('stroke', 'green')
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', lineByIndicator('med70avg'));
    }

    return () => <svg id={props.id} width={width} height={height}/>;
  },
});
