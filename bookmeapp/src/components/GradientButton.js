// 📁 src/components/GradientButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function GradientButton({ text, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.button}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.text}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center'
  },
  text: {
    ...typography.body,
    color: colors.buttonText,
    fontWeight: '600'
  }
});
