import { SearchScreen } from '@/components/search/SearchScreen';
import { Stack } from 'expo-router';

export default function SearchPage() {
  return (
    <>
      <Stack.Screen
        options={{
          animation: 'fade',
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' },
          headerShown: false,
        }}
      />
      <SearchScreen />
    </>
  );
}
