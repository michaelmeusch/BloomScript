import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/constants/api';

import { useAuthorProfile } from '@/context/AuthorProfileContext';
import { useBooks } from '@/context/BookContext';
import { themes, ThemeName } from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { LanguageCode, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { useSubscription } from '@/lib/revenuecat';

const ALL_SCOPED_PREFIXES = [
  '@CAS:books',
  '@CAS:folders',
  '@CAS:artist_likes',
  '@CAS:artist_reviews',
  '@CAS:author_profile',
  '@CAS:terms_accepted',
];

const ACTIVE_DAYS = 30;

const COLOR_SCHEMES: { name: ThemeName; label: string; swatches: string[] }[] = [
  { name: 'classic', label: 'Classic', swatches: ['#F8F4EE', '#2D4A3E', '#C4913A'] },
  { name: 'midnight', label: 'Midnight Ink', swatches: ['#0D1117', '#3A6B9A', '#E8C87A'] },
  { name: 'sage', label: 'Sage & Linen', swatches: ['#F0EAE0', '#4A7B6F', '#C0553E'] },
  { name: 'dusk', label: 'Dusk Plum', swatches: ['#130E1E', '#9B7FD4', '#E8A86E'] },
  { name: 'blossom', label: 'Blossom', swatches: ['#FDF6F8', '#C2607A', '#D4926A'] },
  { name: 'steel', label: 'Steel & Navy', swatches: ['#D2BCA1', '#273F5B', '#6F481C'] },
  { name: 'bordeaux', label: 'Bordeaux & Hunter', swatches: ['#D8D0C2', '#233126', '#4A1A23'] },
  { name: 'forest', label: 'Forest', swatches: ['#F0F5F0', '#2E5232', '#7AAAB2'] },
  { name: 'wisteria', label: 'Wisteria', swatches: ['#F5F1FA', '#6B4A8C', '#4A9B8A'] },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { themeName, setTheme } = useTheme();
  const { isSubscribed } = useSubscription();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { clearProfile } = useAuthorProfile();
  const { deleteBook, books } = useBooks();
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [goodbyeVisible, setGoodbyeVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deadlineLabel = (() => {
    const d = new Date();
    d.setDate(d.getDate() + ACTIVE_DAYS);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your BloomScript Novels Scripts Comic Production account and all your books. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setDeleting(true);
            try {
              await fetch(`${API_BASE}/account/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clerkUserId: user.id,
                  email: user.primaryEmailAddress?.emailAddress,
                  name: user.fullName,
                }),
              });

              const uid = user.id;
              const keysToRemove = ALL_SCOPED_PREFIXES.map((p) => `${p}:${uid}`);
              await AsyncStorage.multiRemove(keysToRemove);
              clearProfile();

              setGoodbyeVisible(true);
              await user.delete();
            } catch {
              setDeleting(false);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetLibrary = () => {
    Alert.alert(
      'Reset My Library',
      'This will permanently delete all your books, folders, and profile data from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            const uid = user?.id;
            if (!uid) return;
            try {
              const keysToRemove = ALL_SCOPED_PREFIXES.map((prefix) => `${prefix}:${uid}`);
              await AsyncStorage.multiRemove(keysToRemove);
              books.forEach((b) => deleteBook(b.id));
              clearProfile();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Done', 'Your library has been reset. You now have a fresh account.');
            } catch {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      signOut();
      return;
    }
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          signOut();
        },
      },
    ]);
  };

  const handleSelectLanguage = async (code: LanguageCode) => {
    setLangPickerVisible(false);
    await setLanguage(code);
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>{t('settings.title')}</Text>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('settings.account')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.accountRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                  {(user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>
                  {user?.fullName ?? 'Author'}
                </Text>
                <Text style={[styles.accountEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {user?.emailAddresses?.[0]?.emailAddress ?? ''}
                </Text>
              </View>
              {isSubscribed && (
                <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => { router.back(); setTimeout(() => router.push('/my-profile'), 300); }}
              activeOpacity={0.7}
            >
              <Feather name="user" size={16} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{t('settings.authorProfile')}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Feather name="log-out" size={16} color="#DC2626" />
              <Text style={[styles.menuLabel, { color: '#DC2626' }]}>{t('settings.signOut')}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription */}
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('settings.subscription')}</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => { router.back(); setTimeout(() => router.push('/paywall'), 300); }}
                activeOpacity={0.7}
              >
                <Feather name="star" size={16} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                    {isSubscribed ? t('settings.upgradeTitle') : t('settings.upgradePro')}
                  </Text>
                  {isSubscribed && (
                    <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{t('settings.activeSubscription')}</Text>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Language */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('settings.language')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setLangPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Feather name="globe" size={16} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{t('settings.currentLanguage')}</Text>
              <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>
                {currentLang?.nativeLabel ?? 'English'}
              </Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('settings.appearance')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14 }]}>
            <Text style={[styles.appearanceTitle, { color: colors.foreground }]}>{t('settings.writingSpaceTheme')}</Text>
            <Text style={[styles.appearanceSub, { color: colors.mutedForeground }]}>
              {t('settings.writingSpaceThemeSub')}
            </Text>
            <View style={schemeStyles.grid}>
              {COLOR_SCHEMES.map((scheme) => {
                const isSelected = themeName === scheme.name;
                const palette = themes[scheme.name];
                return (
                  <TouchableOpacity
                    key={scheme.name}
                    style={[
                      schemeStyles.card,
                      {
                        backgroundColor: palette.card,
                        borderColor: isSelected ? palette.primary : palette.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      setTheme(scheme.name);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[schemeStyles.preview, { backgroundColor: palette.background }]}>
                      <View style={[schemeStyles.previewBar, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
                        <View style={[schemeStyles.previewDot, { backgroundColor: palette.primary }]} />
                        <View style={[schemeStyles.previewLine, { backgroundColor: palette.muted }]} />
                      </View>
                      <View style={schemeStyles.previewBody}>
                        <View style={[schemeStyles.previewRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                          <View style={[schemeStyles.previewAccent, { backgroundColor: palette.primary }]} />
                          <View style={[schemeStyles.previewTextLine, { backgroundColor: palette.foreground }]} />
                        </View>
                        <View style={[schemeStyles.previewRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                          <View style={[schemeStyles.previewAccent, { backgroundColor: palette.accent }]} />
                          <View style={[schemeStyles.previewTextLine, { backgroundColor: palette.mutedForeground, opacity: 0.6 }]} />
                        </View>
                      </View>
                    </View>
                    <View style={schemeStyles.cardInfo}>
                      <View style={schemeStyles.swatchRow}>
                        {scheme.swatches.map((hex) => (
                          <View key={hex} style={[schemeStyles.swatch, { backgroundColor: hex, borderColor: palette.border }]} />
                        ))}
                        {isSelected && (
                          <View style={[schemeStyles.checkBadge, { backgroundColor: palette.primary }]}>
                            <Feather name="check" size={9} color={palette.primaryForeground} />
                          </View>
                        )}
                      </View>
                      <Text style={[schemeStyles.schemeLabel, { color: palette.foreground }]}>{scheme.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('settings.about')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
                setTimeout(() => router.push('/(tabs)/onboarding' as never), 300);
              }}
              activeOpacity={0.7}
            >
              <Feather name="compass" size={16} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>App Guide</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.menuRow}>
              <Feather name="info" size={16} color={colors.mutedForeground} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{t('settings.version')}</Text>
              <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: '#DC2626' }]}>Danger Zone</Text>
          <View style={[styles.dangerCard, { backgroundColor: colors.card, borderColor: '#DC2626' + '33' }]}>
            <Text style={[styles.dangerBody, { color: colors.mutedForeground }]}>
              If your account is showing someone else's books, use this to wipe your local data and start fresh.
            </Text>
            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: '#DC2626' }]}
              onPress={handleResetLibrary}
              activeOpacity={0.8}
            >
              <Feather name="trash-2" size={15} color="#DC2626" />
              <Text style={styles.dangerBtnText}>Reset My Library</Text>
            </TouchableOpacity>

            <View style={[styles.dangerDivider, { backgroundColor: '#DC2626' + '22' }]} />

            <Text style={[styles.dangerBody, { color: colors.mutedForeground }]}>
              Permanently delete your account and all your books from BloomScript Novels Scripts Comic Production.
            </Text>
            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: '#DC2626' }]}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
              disabled={deleting}
            >
              <Feather name="user-x" size={15} color="#DC2626" />
              <Text style={styles.dangerBtnText}>{deleting ? 'Deleting…' : 'Delete Account'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Goodbye modal */}
      <Modal visible={goodbyeVisible} transparent animationType="fade">
        <View style={styles.goodbyeOverlay}>
          <View style={[styles.goodbyeCard, { backgroundColor: colors.card }]}>
            <View style={[styles.goodbyeIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="book-open" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.goodbyeTitle, { color: colors.foreground }]}>
              Thanks for trying out BloomScript Novels Scripts Comic Production
            </Text>
            <Text style={[styles.goodbyeBody, { color: colors.mutedForeground }]}>
              We're sad to see you go. Your account data will remain active until{' '}
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
                {deadlineLabel}
              </Text>
              , after which it will be permanently removed.
            </Text>
            <Text style={[styles.goodbyeWish, { color: colors.mutedForeground }]}>
              Keep writing — wherever the story takes you. ✍️
            </Text>
          </View>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={langPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('settings.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setLangPickerVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langRow,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.primary + '12' },
                    ]}
                    onPress={() => handleSelectLanguage(lang.code)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langNative, { color: colors.foreground }]}>{lang.nativeLabel}</Text>
                      <Text style={[styles.langEnglish, { color: colors.mutedForeground }]}>{lang.label}</Text>
                    </View>
                    {isSelected && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  accountEmail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  menuSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  menuValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginRight: 4,
  },
  appearanceTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  appearanceSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
  },
  dangerCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  dangerBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dangerBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#DC2626' },
  dangerDivider: { height: 1, marginVertical: 4 },
  goodbyeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  goodbyeCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  goodbyeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodbyeTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  goodbyeBody: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  goodbyeWish: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  langNative: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.2,
  },
  langEnglish: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});

const schemeStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    height: 70,
    overflow: 'hidden',
  },
  previewBar: {
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    opacity: 0.4,
  },
  previewBody: {
    flex: 1,
    padding: 4,
    gap: 3,
  },
  previewRow: {
    flex: 1,
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  previewAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginVertical: 3,
  },
  previewTextLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  cardInfo: {
    padding: 8,
    gap: 3,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    marginBottom: 1,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  schemeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
  },
});
