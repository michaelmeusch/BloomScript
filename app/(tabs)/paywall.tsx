import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Purchases from 'react-native-purchases';

import { useTranslation } from 'react-i18next';

import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export default function PaywallScreen() {
  const colors = useColors();
  const { t } = useTranslation();

  const FEATURES: { icon: FeatherName; label: string }[] = [
    { icon: 'image', label: t('paywall.features.illustrations') },
    { icon: 'zap', label: t('paywall.features.aiGeneration') },
    { icon: 'book-open', label: t('paywall.features.unlimited') },
    { icon: 'star', label: t('paywall.features.priority') },
  ];
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const { offerings, isPurchasing, isRestoring, isSubscribed, isLoading: subscriptionLoading, customerInfo, initError: rcInitError, purchase, restore } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubscribed, setJustSubscribed] = useState(false);

  useEffect(() => {
    if (!justSubscribed) return;
    const t = setTimeout(() => router.back(), 1800);
    return () => clearTimeout(t);
  }, [justSubscribed]);

  const currentOffering = offerings?.current;
  const monthlyPkg = currentOffering?.availablePackages.find((p) => p.packageType === 'MONTHLY');
  const annualPkg = currentOffering?.availablePackages.find((p) => p.packageType === 'ANNUAL');
  const selectedPkg = selectedPlan === 'monthly' ? monthlyPkg : annualPkg;
  const displayMonthlyPrice = monthlyPkg?.product.priceString ?? null;
  const displayAnnualPrice = annualPkg?.product.priceString ?? null;
  const offeringsLoading = !offerings;

  const handleSubscribe = () => {
    if (!selectedPkg) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirmVisible(true);
  };

  const confirmPurchase = async (confirm: boolean) => {
    setConfirmVisible(false);
    if (!confirm || !selectedPkg) return;
    setError(null);
    try {
      await purchase(selectedPkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJustSubscribed(true);
    } catch (err) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e.userCancelled) {
        setError(e.message ?? 'Purchase failed. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    setError(null);
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJustSubscribed(true);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Restore failed. Please try again.');
    }
  };

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 16;

  const proEntitlement = customerInfo?.entitlements.active?.['pro'];
  const expiryDate = proEntitlement?.expirationDate
    ? new Date(proEntitlement.expirationDate).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  if (subscriptionLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isSubscribed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding, paddingHorizontal: isTablet ? Math.max(20, (screenWidth - 600) / 2) : 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={styles.hero}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 88, height: 88, borderRadius: 20 }}
              resizeMode="contain"
            />
            <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>BloomScript Pro</Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              {justSubscribed ? t('paywall.welcomeProSubtitle') : t('paywall.alreadyProSubtitle')}
            </Text>
            {justSubscribed && (
              <TouchableOpacity
                style={[styles.subscribeBtn, { backgroundColor: colors.accent, marginTop: 8 }]}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Feather name="arrow-left" size={16} color="#fff" />
                <Text style={styles.subscribeBtnText}>{t('paywall.returnToWriting')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.featureRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: colors.accent + '18' }]}>
                <Feather name="check-circle" size={16} color={colors.accent} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{t('paywall.subscriptionActive')}</Text>
              <Feather name="check" size={14} color={colors.accent} />
            </View>
            {expiryDate && (
              <View style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name="calendar" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.foreground }]}>
                  {t('paywall.renewsDate', { date: expiryDate })}
                </Text>
              </View>
            )}
          </View>

          {error && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.subscribeBtn, { backgroundColor: colors.primary }]}
            onPress={async () => {
              try {
                await Purchases.showManageSubscriptions();
              } catch (err) {
                const e = err as { message?: string };
                setError(e.message ?? 'Could not open subscription management.');
              }
            }}
            activeOpacity={0.85}
          >
            <Feather name="settings" size={18} color="#fff" />
            <Text style={styles.subscribeBtnText}>{t('paywall.manageSubscription')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
                {t('paywall.restore')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding, paddingHorizontal: isTablet ? Math.max(20, (screenWidth - 600) / 2) : 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 88, height: 88, borderRadius: 20 }}
            resizeMode="contain"
          />
          <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            BloomScript Pro
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            {t('paywall.heroSubtitle')}
          </Text>
        </View>

        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Feather name={f.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.label}</Text>
              <Feather name="check" size={14} color={colors.accent} />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {t('paywall.choosePlan')}
        </Text>

        <TouchableOpacity
          style={[
            styles.planCard,
            {
              backgroundColor: colors.card,
              borderColor: selectedPlan === 'annual' ? colors.accent : colors.border,
              borderWidth: selectedPlan === 'annual' ? 2 : 1,
            },
          ]}
          onPress={() => { Haptics.selectionAsync(); setSelectedPlan('annual'); }}
          activeOpacity={0.85}
        >
          <View style={styles.planCardTop}>
            <View>
              <View style={styles.planTitleRow}>
                <Text style={[styles.planName, { color: colors.foreground }]}>{t('paywall.planAnnual')}</Text>
                <View style={[styles.saveBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.saveBadgeText}>{t('paywall.bestValue')}</Text>
                </View>
              </View>
              <Text style={[styles.planNote, { color: colors.mutedForeground }]}>
                {t('paywall.billedYearly')}
              </Text>
            </View>
            <View style={styles.planPriceCol}>
              {offeringsLoading && !displayAnnualPrice ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : displayAnnualPrice ? (
                <>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>{displayAnnualPrice}</Text>
                  <Text style={[styles.planPricePer, { color: colors.mutedForeground }]}>{t('paywall.perYear')}</Text>
                </>
              ) : (
                <Text style={[styles.planPricePer, { color: colors.mutedForeground }]}>{t('paywall.unavailable')}</Text>
              )}
            </View>
          </View>
          <View style={[styles.planRadio, { borderColor: selectedPlan === 'annual' ? colors.accent : colors.border }]}>
            {selectedPlan === 'annual' && (
              <View style={[styles.planRadioInner, { backgroundColor: colors.accent }]} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.planCard,
            {
              backgroundColor: colors.card,
              borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
              borderWidth: selectedPlan === 'monthly' ? 2 : 1,
            },
          ]}
          onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
          activeOpacity={0.85}
        >
          <View style={styles.planCardTop}>
            <View>
              <Text style={[styles.planName, { color: colors.foreground }]}>{t('paywall.planMonthly')}</Text>
              <Text style={[styles.planNote, { color: colors.mutedForeground }]}>
                {t('paywall.billedMonthly')}
              </Text>
            </View>
            <View style={styles.planPriceCol}>
              {offeringsLoading && !displayMonthlyPrice ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : displayMonthlyPrice ? (
                <>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>{displayMonthlyPrice}</Text>
                  <Text style={[styles.planPricePer, { color: colors.mutedForeground }]}>{t('paywall.perMonth')}</Text>
                </>
              ) : (
                <Text style={[styles.planPricePer, { color: colors.mutedForeground }]}>{t('paywall.unavailable')}</Text>
              )}
            </View>
          </View>
          <View style={[styles.planRadio, { borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border }]}>
            {selectedPlan === 'monthly' && (
              <View style={[styles.planRadioInner, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            { backgroundColor: selectedPlan === 'annual' ? colors.accent : colors.primary },
          ]}
          onPress={handleSubscribe}
          disabled={isPurchasing || isRestoring || !selectedPkg}
          activeOpacity={0.85}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="smartphone" size={18} color="#fff" />
              <Text style={styles.subscribeBtnText}>
                {selectedPlan === 'annual'
                  ? displayAnnualPrice ? t('paywall.subscribeAnnual', { price: displayAnnualPrice }) : t('paywall.subscribeAnnualFallback')
                  : displayMonthlyPrice ? t('paywall.subscribeMonthly', { price: displayMonthlyPrice }) : t('paywall.subscribeMonthlyFallback')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.legalNote, { color: colors.mutedForeground }]}>
          {t('paywall.legalNote')}
        </Text>

        <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
              {t('paywall.restore')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="shopping-cart" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('paywall.confirmTitle')}
            </Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              {selectedPlan === 'annual'
                ? displayAnnualPrice ? t('paywall.confirmAnnual', { price: displayAnnualPrice }) : t('paywall.confirmAnnualNoPrice')
                : displayMonthlyPrice ? t('paywall.confirmMonthly', { price: displayMonthlyPrice }) : t('paywall.confirmMonthlyNoPrice')}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => confirmPurchase(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={() => confirmPurchase(true)}
              >
                <Text style={styles.modalConfirmText}>{t('paywall.subscribe')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  proBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: -8,
  },
  proBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  featuresCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  saveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  planNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  planPricePer: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#DC2626',
    flex: 1,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 6,
  },
  subscribeBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  legalNote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
