import { defineComponent } from 'vue';
import useStore from "@/helpers/useStore";

export default defineComponent({
  name: 'Settings',
  props: {},
  setup(props) {
    const store = useStore();

    return () => (
      <form>
        <table class="settings">
          <tr class="form-row">
            <td>
              <label for="meditationTimeMax">Meditation time, sec:</label>
            </td>
            <td>
              <input id="meditationTimeMax" size="2" value={store.state.meditationTimeMax} type="text" />
            </td>
          </tr>
          <tr class="form-row">
            <td>
              <label for="meditationFrom">Meditation threshold:</label>
            </td>
            <td>
              <input id="meditationFrom" size="2" value={store.state.meditationFrom} type="text" />
            </td>
          </tr>
          <tr class="form-row">
            <td>
              <label for="fromDay">Show history from day:</label>
            </td>
            <td>
              <input id="fromDay" size="10" value={store.state.fromDay} type="text" />
            </td>
          </tr>
          <tr class="form-row">
            <td>
              <label for="isSound">Sound:</label>
            </td>
            <td>
              <input id="isSound" type="checkbox" value={store.state.isSound} />
            </td>
          </tr>
          <tr class="form-row">
            <td>
              <label for="halfChartTop">Chart from 70%:</label>
            </td>
            <td>
              <input id="halfChartTop" type="checkbox" value={store.state.halfChartTop} />
            </td>
          </tr>
          <tr class="form-row">
            <td>
              <label for="halfChartBottom">Chart to 30%:</label>
            </td>
            <td>
              <input id="halfChartBottom" type="checkbox" value={store.state.halfChartBottom} />
            </td>
          </tr>
          <tr class="form-row">
            <td>
              <label for="meditationZones">Show zones:</label>
            </td>
            <td>
              <input id="meditationZones" type="checkbox" value={store.state.meditationZones} />
            </td>
          </tr>
        </table>
      </form>
    );
  },
});
