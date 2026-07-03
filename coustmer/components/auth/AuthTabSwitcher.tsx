import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

type AuthTab = {
  key: string;
  label: string;
};

type AuthTabSwitcherProps = {
  tabs: AuthTab[];
  activeTab: string;
  onChange: (key: string) => void;
};

export function AuthTabSwitcher({
  tabs,
  activeTab,
  onChange,
}: AuthTabSwitcherProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {isActive ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    position: 'relative',
  },
  label: {
    color: authTheme.textDim,
    fontSize: 15,
    fontWeight: '600',
  },
  labelActive: {
    color: authTheme.brand,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
    backgroundColor: authTheme.brand,
  },
});
