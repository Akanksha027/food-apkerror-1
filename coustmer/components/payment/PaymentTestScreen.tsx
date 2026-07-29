import { Pressable } from '@/components/common/Pressable';
import { useState } from 'react';
import { Alert,
  
  StyleSheet,
  Text,
  TextInput,
  View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { PaymentGatewayWebView } from './PaymentGatewayWebView';

export function PaymentTestScreen() {
  const [paymentUrl, setPaymentUrl] = useState('');
  const [webViewOpen, setWebViewOpen] = useState(false);

  const testUrls = [
    'https://checkout.razorpay.com/v1/checkout.js',
    'https://js.stripe.com/v3/',
    'https://sandbox.payu.in/_payment',
    'https://test.paytm.in/oltp-web/processTransaction',
  ];

  const handleTestPayment = () => {
    if (!paymentUrl) {
      Alert.alert('Error', 'Please enter a payment URL');
      return;
    }
    setWebViewOpen(true);
  };

  const handlePaymentComplete = (success: boolean, data?: any) => {
    setWebViewOpen(false);
    Alert.alert(
      'Payment Result',
      `Payment ${success ? 'Successful' : 'Failed'}\nData: ${JSON.stringify(data, null, 2)}`
    );
  };

  const handleClose = () => {
    setWebViewOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Payment Gateway Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Enter Payment URL:</Text>
          <TextInput
            style={styles.input}
            value={paymentUrl}
            onChangeText={setPaymentUrl}
            placeholder="https://example.com/payment"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Or try these test URLs:</Text>
          {testUrls.map((url, index) => (
            <Pressable
              key={index}
              style={styles.testUrl}
              onPress={() => setPaymentUrl(url)}
            >
              <Text style={styles.testUrlText} numberOfLines={1}>
                {url}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.testBtn, !paymentUrl && styles.testBtnDisabled]}
          onPress={handleTestPayment}
          disabled={!paymentUrl}
        >
          <Text style={styles.testBtnText}>Test Payment Gateway</Text>
        </Pressable>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Debug Info:</Text>
          <Text style={styles.infoText}>
            This screen tests the PaymentGatewayWebView component.
            {'\n\n'}
            The WebView will attempt to load the provided URL and detect
            payment completion based on URL changes and page content.
            {'\n\n'}
            Success indicators: 'success', 'complete', 'payment-success'
            {'\n'}
            Failure indicators: 'fail', 'error', 'cancel', 'declined'
          </Text>
        </View>
      </View>

      <PaymentGatewayWebView
        visible={webViewOpen}
        onClose={handleClose}
        paymentUrl={paymentUrl}
        onPaymentComplete={handlePaymentComplete}
        orderAmount={99.99}
        orderNumber="TEST-001"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: authTheme.text,
    textAlign: 'center',
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: authTheme.text,
  },
  input: {
    backgroundColor: authTheme.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: authTheme.text,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  testUrl: {
    backgroundColor: authTheme.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  testUrlText: {
    fontSize: 12,
    color: authTheme.brand,
    fontFamily: 'monospace',
  },
  testBtn: {
    backgroundColor: authTheme.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  testBtnDisabled: {
    opacity: 0.5,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    backgroundColor: authTheme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: authTheme.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 18,
  },
});