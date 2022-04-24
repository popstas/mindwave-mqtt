import { defineComponent } from 'vue';
import setPageTitle from '@/helpers/setPageTitle';
import MeditationsList from '@/components/MeditationsList';

export default defineComponent({
  name: 'HistoryPage',
  setup() {
    setPageTitle('История');

    return () => (
      <div>
        <h1>История</h1>

        <MeditationsList />
      </div>
    );
  }
});