import { defineComponent, ref } from 'vue';
import useStore from '@/helpers/useStore';
import Settings from '@/components/Settings'
import CurrentMeditation from '@/components/CurrentMeditation'
import MeditationsList from '@/components/MeditationsList'
import DaysList from '@/components/DaysList'

export default defineComponent({
  name: 'MainPage',
  setup() {
    const store = useStore();
    console.log('store:', store);

    return () => (
      <div>
        <Settings></Settings>
        <CurrentMeditation></CurrentMeditation>
        <MeditationsList></MeditationsList>
        <DaysList></DaysList>
      </div>
    )
  }
});