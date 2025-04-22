import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function UserCompanySelector({ selected, onSelect }) {
  return (
    <View style={styles.container}>
      {['usuario', 'empresa'].map(option => (
        <TouchableOpacity
          key={option}
          style={[styles.option, selected === option && styles.selected]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.text, selected === option && styles.textSelected]}>
            {option === 'usuario' ? 'Usuario' : 'Empresa'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.primary,
  },
  textSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});
