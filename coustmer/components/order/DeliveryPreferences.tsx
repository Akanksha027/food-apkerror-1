import { Image } from 'expo-image';
import { BellOff, DoorOpen, MapPin, PhoneOff, X, CheckSquare, Square } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const TIP_IMAGE_IDLE = 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png';
const TIP_IMAGE_HAPPY = 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png';
const BIKE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png';

import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'tip' | 'instructions';

interface Props {
  tip: number;
  setTip: (tip: number) => void;
  specialInstructions: string;
  setSpecialInstructions: (inst: string) => void;
  onFocusOther?: () => void;
}

const INSTRUCTION_OPTIONS = [
  { id: 'directions', label: 'Directions to reach', icon: MapPin },
  { id: 'leave_door', label: 'Leave at the door', icon: DoorOpen },
  { id: 'no_call', label: 'Avoid calling', icon: PhoneOff },
  { id: 'no_bell', label: 'Avoid ringing bell', icon: BellOff },
];



export function DeliveryPreferences({
  tip,
  setTip,
  specialInstructions,
  setSpecialInstructions,
  onFocusOther,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('tip');
  const [autoTip, setAutoTip] = useState(false);
  
  const [animatingTip, setAnimatingTip] = useState(false);
  const bikeAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const cannonRef = useRef<any>(null);

  const [customTip, setCustomTip] = useState('');
  const [isOtherActive, setIsOtherActive] = useState(false);

  const handleTipSelect = (amt: number, skipAnimation = false) => {
    if (tip === amt && amt !== 0) {
      setTip(0);
      setIsOtherActive(false);
      return;
    }
    setTip(amt);
    
    // Trigger animation
    if (!skipAnimation && amt > 0) {
      if (cannonRef.current) {
        cannonRef.current.start();
      }

      if (!animatingTip) {
        setAnimatingTip(true);
        bikeAnim.setValue(-SCREEN_WIDTH); 
        
        Animated.timing(bikeAnim, {
          toValue: SCREEN_WIDTH + 150,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          setAnimatingTip(false);
        });
      }
    }
  };

  const toggleInstruction = (label: string) => {
    let current = (specialInstructions || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (current.includes(label)) {
      current = current.filter((l) => l !== label);
    } else {
      current.push(label);
    }
    setSpecialInstructions(current.join(', '));
  };

  const hasInstruction = (label: string) => {
    return (specialInstructions || '')
      .split(',')
      .map((s) => s.trim())
      .includes(label);
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'tip' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tip')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'tip' && styles.tabTextActive,
            ]}
          >
            Tip
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabBtn,
            activeTab === 'instructions' && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab('instructions')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'instructions' && styles.tabTextActive,
            ]}
          >
            Instructions
          </Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'tip' ? (
          <View style={{ position: 'relative' }}>
            <View style={styles.tipHeaderRow}>
              <Text style={styles.tipDesc}>
                Day & night, our delivery partners bring your favourite meals. Thank them with a tip.
              </Text>
              <Image 
                source={{ uri: TIP_IMAGE_IDLE }} 
                style={styles.tipImage} 
                contentFit="contain" 
              />
            </View>

            <View style={styles.tipOptionsRow}>
              {[20, 30, 50].map((amt) => {
                const isSelected = tip === amt;
                const isMostTipped = amt === 30;
                return (
                  <Pressable
                    key={amt}
                    style={[
                      styles.tipOption,
                      isSelected && styles.tipOptionSelected,
                      isMostTipped && { paddingBottom: 16 }, 
                    ]}
                    onPress={() => handleTipSelect(amt)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[
                          styles.tipAmtText,
                          isSelected && styles.tipAmtTextSelected,
                        ]}
                      >
                        ₹{amt}
                      </Text>
                      {isSelected && (
                        <X size={12} color="#FF5A41" style={{ marginLeft: 4 }} strokeWidth={3} />
                      )}
                    </View>
                    {isMostTipped && !isSelected && (
                      <View style={styles.mostTippedBadge}>
                        <Text style={styles.mostTippedText}>Most Tipped</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}


            </View>

            <Pressable 
              style={[styles.checkboxRow, { opacity: tip > 0 ? 1 : 0 }]}
              onPress={() => tip > 0 && setAutoTip(!autoTip)}
              disabled={tip === 0}
            >
              {autoTip ? (
                <CheckSquare size={18} color="#FF5A41" />
              ) : (
                <Square size={18} color="#9CA3AF" />
              )}
              <Text style={styles.checkboxText}>Add this tip automatically to future orders</Text>
            </Pressable>

            <ConfettiCannon 
              ref={cannonRef}
              count={150}
              origin={{x: SCREEN_WIDTH / 2 - 40, y: -20}}
              autoStart={false}
              explosionSpeed={250}
              fallSpeed={1500}
              fadeOut={true}
            />

            {animatingTip && (
              <Animated.Image 
                source={{ uri: BIKE_IMAGE }} 
                style={[
                  styles.bikeAnimation, 
                  { transform: [{ translateX: bikeAnim }, { scaleX: -1 }] }
                ]}
                contentFit="contain"
              />
            )}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instScroll}>
            {INSTRUCTION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = hasInstruction(opt.label);
              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.instCard,
                    selected && styles.instCardSelected,
                  ]}
                  onPress={() => toggleInstruction(opt.label)}
                >
                  <Icon
                    color={selected ? '#FF5A41' : '#4b5563'}
                    size={24}
                    strokeWidth={selected ? 2.5 : 2}
                    style={{ marginBottom: 12 }}
                  />
                  <Text
                    style={[
                      styles.instLabel,
                      selected && styles.instLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    // Removed overflow: hidden to allow bike and confetti to cross screen bounds
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 24,
  },
  tabBtnActive: {
    backgroundColor: '#02060C',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    paddingHorizontal: 4,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tipDesc: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginRight: 16,
  },
  tipImage: {
    width: 80,
    height: 80,
  },
  tipOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2, // above bike
  },
  tipOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  tipOptionSelected: {
    borderColor: '#FF5A41',
    backgroundColor: '#FFF0ED',
  },
  tipAmtText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#1F2937',
  },
  tipAmtTextSelected: {
    color: '#FF5A41',
  },
  mostTippedBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF5A41',
    paddingVertical: 2,
    alignItems: 'center',
  },
  mostTippedText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
    zIndex: 2,
  },
  checkboxText: {
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#4B5563',
  },
  bikeAnimation: {
    position: 'absolute',
    bottom: -10,
    width: 60,
    height: 60,
    zIndex: 10, // Bring bike ABOVE the tip cards
    opacity: 1,
  },
  instScroll: {
    paddingVertical: 4,
  },
  instCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    width: 100,
    height: 100,
    marginRight: 12,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  instCardSelected: {
    borderColor: '#FF5A41',
    backgroundColor: '#FFF0ED',
  },
  instLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 16,
  },
  instLabelSelected: {
    color: '#FF5A41',
  },
});
