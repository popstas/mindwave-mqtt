import { defineComponent, ref, Transition } from 'vue';
import useStore from '@/helpers/useStore';
import setPageTitle from '@/helpers/setPageTitle';
import MeditationsList from '@/components/MeditationsList';

export default defineComponent({
  name: 'HistoryPage',
  setup() {
    setPageTitle('История');
    const store = useStore();

    return () => (
      <div>
        <h1>История</h1>

        <MeditationsList
        ></MeditationsList>
      </div>
    );
  }
});