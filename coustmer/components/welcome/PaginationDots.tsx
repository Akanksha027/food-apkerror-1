import { View } from 'react-native';

type PaginationDotsProps = {
  total?: number;
  activeIndex?: number;
};

export function PaginationDots({ total = 3, activeIndex = 0 }: PaginationDotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={
            index === activeIndex
              ? 'h-[5px] w-7 rounded-full bg-brand-primary'
              : 'h-[5px] w-[5px] rounded-full bg-white/35'
          }
        />
      ))}
    </View>
  );
}
