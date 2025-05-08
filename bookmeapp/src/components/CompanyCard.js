import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

// Ancho de la tarjeta
const CARD_WIDTH = Dimensions.get('window').width * 0.9;
const BANNER_HEIGHT = 120;
const LOGO_SIZE = 64;

export default function CompanyCard({ 
  bannerUrl, 
  logoUrl, 
  name, 
  address, 
  description, 
  onPress 
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Banner */}
      <Image source={{ uri: bannerUrl }} style={styles.banner} />

      {/* Logo superpuesto */}
      <View style={styles.logoContainer}>
        <Image source={{ uri: logoUrl }} style={styles.logo} />
      </View>

      {/* Info debajo */}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.address} numberOfLines={1}>{address}</Text>
        <Text style={styles.desc} numberOfLines={2}>{description}</Text>

        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Ver empresa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
    alignSelf: 'center',
    // sombra ligera
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT
  },
  logoContainer: {
    position: 'absolute',
    top: BANNER_HEIGHT - LOGO_SIZE / 2,
    left: 16,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white
  },
  logo: {
    width: LOGO_SIZE - 8,
    height: LOGO_SIZE - 8,
    borderRadius: (LOGO_SIZE - 8) / 2
  },
  info: {
    paddingTop: LOGO_SIZE / 2 + 8,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4
  },
  address: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 6
  },
  desc: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 12
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  buttonText: {
    ...typography.body,
    color: colors.buttonText,
    fontWeight: '600'
  }
});
