import { useSignUp } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComicHeader } from '@/components/AuthHeader';
import { themes, ThemeName } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  ink:      '#0A0806',
  inkMid:   '#14100A',
  inkLight: '#1E1810',
  border:   '#2E2618',
  gold:     '#FFD600',
  goldMid:  '#FF9500',
  goldDim:  '#C4913A',
  bg:       '#F8F4EE',
  card:     '#FFFFFF',
  formBorder: '#E5DDD3',
  fg:       '#1A1A1A',
  muted:    '#8A7E74',
  primary:  '#2D4A3E',
  error:    '#DC2626',
};

const THEME_ORDER: ThemeName[] = [
  'classic', 'sage', 'forest',
  'blossom', 'wisteria', 'midnight',
  'dusk', 'steel', 'bordeaux',
];

const THEME_LABELS: Record<ThemeName, string> = {
  classic: 'Classic', sage: 'Sage', forest: 'Forest',
  blossom: 'Blossom', wisteria: 'Wisteria', midnight: 'Midnight',
  dusk: 'Dusk', steel: 'Caramel', bordeaux: 'Bordeaux',
};

type Stage = 'details' | 'verify' | 'theme';

// ── Gradient CTA Button ───────────────────────────────────────────────────────
function ComicButton({
  label, onPress, loading, disabled, icon = 'zap', style,
}: {
  label: string; onPress: () => void; loading?: boolean;
  disabled?: boolean; icon?: React.ComponentProps<typeof Feather>['name']; style?: object;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[s.comicBtnWrap, disabled && { opacity: 0.4 }, style]}
    >
      <LinearGradient
        colors={disabled ? ['#888', '#666'] : [C.gold, C.goldMid]}
        style={s.comicBtnGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <>
            <Feather name={icon} size={16} color="#000" />
            <Text style={s.comicBtnText}>{label}</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={s.errorRow}>
      <Feather name="alert-circle" size={14} color={C.error} />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function SignUpScreen() {
  // Core v3 API: { signUp, errors, fetchStatus } — no isLoaded / setActive
  const { signUp, errors, fetchStatus } = useSignUp();
  const { setTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const [stage, setStage]                 = useState<Stage>('details');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [code, setCode]                   = useState('');
  const [agreed, setAgreed]               = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('classic');
  const [errorMessage, setErrorMessage]   = useState<string | null>(null);
  const [finalizing, setFinalizing]       = useState(false);

  const isLoading = fetchStatus === 'fetching';

  // ── Step 1: Submit details ─────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!email.trim() || !password || !agreed) return;
    setErrorMessage(null);

    // Core v3: signUp.password() — returns { error }
    const { error } = await signUp.password({
      emailAddress: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const msg =
        (errors.fields.emailAddress?.message) ??
        (errors.fields.password?.message) ??
        error.message ??
        'Could not create account. Please try again.';
      setErrorMessage(msg);
      return;
    }

    // Send email verification code
    await signUp.verifications.sendEmailCode();
    setStage('verify');
  };

  // ── Step 2: Verify email code ──────────────────────────────────────────────
  const handleVerify = async () => {
    if (!code.trim()) return;
    setErrorMessage(null);

    await signUp.verifications.verifyEmailCode({ code: code.trim() });

    if (signUp.status === 'complete') {
      // Show theme picker before finalising session
      setStage('theme');
    } else {
      const msg = errors.fields.code?.message ?? 'Verification incomplete. Please try again.';
      setErrorMessage(msg);
    }
  };

  const resendCode = async () => {
    try { await signUp.verifications.sendEmailCode(); } catch {}
  };

  // ── Step 3: Pick theme + finalise ─────────────────────────────────────────
  const handleContinueWithTheme = async () => {
    setFinalizing(true);
    try {
      await setTheme(selectedTheme);
      // Core v3: finalize() activates the session and navigates
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          router.replace('/(tabs)/onboarding' as any);
        },
      });
    } catch {
      router.replace('/(tabs)/onboarding' as any);
    } finally {
      setFinalizing(false);
    }
  };

  // ── Theme stage ────────────────────────────────────────────────────────────
  if (stage === 'theme') {
    const picked = themes[selectedTheme];
    return (
      <ScrollView
        style={[s.root, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ComicHeader title="Choose Your Theme" subtitle="Your writing space, your style." />

        <View style={s.formZone}>
          <View style={s.themeGrid}>
            {THEME_ORDER.map(name => {
              const t = themes[name];
              const isSelected = name === selectedTheme;
              return (
                <TouchableOpacity
                  key={name}
                  style={[s.themeCard, isSelected && { borderColor: t.primary, borderWidth: 2.5 }]}
                  onPress={() => setSelectedTheme(name)}
                  activeOpacity={0.75}
                >
                  <View style={[s.themePreview, { backgroundColor: t.background }]}>
                    <View style={[s.themeAccentDot, { backgroundColor: t.accent }]} />
                    <View style={[s.themePrimaryBar, { backgroundColor: t.primary }]} />
                    {isSelected && (
                      <View style={[s.themeCheck, { backgroundColor: t.primary }]}>
                        <Feather name="check" size={10} color={t.primaryForeground} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[s.themeLabel, isSelected && { color: picked.primary, fontFamily: 'Inter_600SemiBold' }]}
                    numberOfLines={1}
                  >
                    {THEME_LABELS[name]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[s.themePreviewBanner, { backgroundColor: picked.card, borderColor: picked.border }]}>
            <View style={[s.themePreviewNav, { backgroundColor: picked.primary }]}>
              <Text style={[s.themePreviewNavText, { color: picked.primaryForeground }]}>
                BloomScript Novels Scripts Comic Production
              </Text>
            </View>
            <View style={s.themePreviewBody}>
              <View style={[s.themePreviewTitle, { backgroundColor: picked.muted, opacity: 0.4 }]} />
              <View style={[s.themePreviewLine, { backgroundColor: picked.muted, opacity: 0.25, width: '80%' }]} />
              <View style={[s.themePreviewLine, { backgroundColor: picked.muted, opacity: 0.2, width: '65%' }]} />
              <View style={[s.themePreviewAccent, { backgroundColor: picked.accent }]} />
            </View>
          </View>

          <ComicButton
            label={`CONTINUE WITH ${THEME_LABELS[selectedTheme].toUpperCase()}`}
            onPress={handleContinueWithTheme}
            loading={finalizing}
            icon="check"
          />
        </View>
      </ScrollView>
    );
  }

  // ── Verify stage ───────────────────────────────────────────────────────────
  if (stage === 'verify') {
    return (
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ paddingTop: insets.top }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ComicHeader title="Check Your Email" subtitle="A verification code was sent to you." />

          <View style={s.formZone}>
            <Text style={s.verifyEmail}>
              Code sent to{' '}
              <Text style={{ color: C.primary, fontFamily: 'Inter_600SemiBold' }}>{email}</Text>
            </Text>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Verification code</Text>
              <TextInput
                style={[s.input, s.codeInput]}
                value={code}
                onChangeText={v => { setCode(v); setErrorMessage(null); }}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor={C.muted}
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                autoFocus
              />
            </View>

            {errors.fields.code && (
              <ErrorBanner message={errors.fields.code.message} />
            )}
            {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

            <ComicButton
              label="VERIFY EMAIL"
              onPress={handleVerify}
              loading={isLoading}
              disabled={!code}
              icon="mail"
            />

            <TouchableOpacity style={s.ghostBtn} onPress={resendCode} disabled={isLoading}>
              <Text style={s.ghostBtnText}>Resend code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => setStage('details')}>
              <Text style={s.ghostBtnText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Details stage (main) ───────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ComicHeader title="Create Account" subtitle="Your story begins here." />

        <View style={s.formZone}>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={v => { setEmail(v); setErrorMessage(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              returnKeyType="next"
            />
            {errors.fields.emailAddress && (
              <Text style={s.fieldError}>{errors.fields.emailAddress.message}</Text>
            )}
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Password</Text>
            <View style={s.passwordRow}>
              <TextInput
                style={[s.input, s.passwordInput]}
                value={password}
                onChangeText={v => { setPassword(v); setErrorMessage(null); }}
                secureTextEntry={!showPassword}
                placeholder="Create a strong password"
                placeholderTextColor={C.muted}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            {errors.fields.password && (
              <Text style={s.fieldError}>{errors.fields.password.message}</Text>
            )}
          </View>

          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

          {/* Terms checkbox */}
          <View style={s.checkboxRow}>
            <TouchableOpacity
              onPress={() => setAgreed(v => !v)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[s.checkbox, agreed && s.checkboxChecked]}>
                {agreed && <Feather name="check" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
            <View style={s.checkboxLabelCol}>
              <TouchableOpacity onPress={() => setAgreed(v => !v)} activeOpacity={0.7}>
                <Text style={s.checkboxLabel}>I have read and agree to the</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/terms')} activeOpacity={0.7}>
                <Text style={s.checkboxLink}>Terms &amp; Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Required for sign-up flows — Clerk bot protection */}
          <View nativeID="clerk-captcha" />

          <ComicButton
            label="BEGIN YOUR STORY"
            onPress={handleSignUp}
            loading={isLoading}
            disabled={!email || !password || !agreed}
            icon="zap"
          />

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>ALREADY A CREATOR?</Text>
            <View style={s.dividerLine} />
          </View>

          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity style={s.switchBtn} activeOpacity={0.7}>
              <Text style={s.switchText}>Sign in to your account</Text>
              <Feather name="arrow-right" size={14} color={C.goldDim} />
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  formZone: { paddingHorizontal: 22, paddingTop: 28, gap: 16 },

  comicBtnWrap: {
    borderRadius: 14, overflow: 'hidden', marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: C.gold, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45, shadowRadius: 18,
      },
      android: { elevation: 12 },
    }),
  },
  comicBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  comicBtnText: {
    fontSize: 15, fontFamily: 'Inter_700Bold',
    color: '#000', letterSpacing: 1.2,
  },

  fieldGroup:    { gap: 6 },
  label:         { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.fg },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.formBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: C.fg,
  },
  codeInput:     { textAlign: 'center', fontSize: 28, fontFamily: 'Inter_600SemiBold', letterSpacing: 8 },
  passwordRow:   { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, paddingRight: 48 },
  eyeBtn:        { position: 'absolute', right: 16, height: '100%', justifyContent: 'center' },
  fieldError:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.error, marginTop: 2 },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.error, flex: 1 },

  checkboxRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 2 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 2,
    borderColor: C.formBorder, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  checkboxChecked:  { backgroundColor: C.primary, borderColor: C.primary },
  checkboxLabelCol: { flex: 1, gap: 2 },
  checkboxLabel:    { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.muted, lineHeight: 20 },
  checkboxLink:     { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.goldDim, lineHeight: 20 },

  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.formBorder },
  dividerText: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5 },

  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  switchText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.goldDim },

  ghostBtn:     { alignItems: 'center', paddingVertical: 10 },
  ghostBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.muted },

  verifyEmail: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.muted, marginBottom: 4 },

  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 },
  themeCard: { width: '33.33%', paddingHorizontal: 6, marginBottom: 14, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  themePreview: { height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  themeAccentDot: { position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderRadius: 6 },
  themePrimaryBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 22 },
  themeCheck: { position: 'absolute', bottom: 4, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { marginTop: 5, fontSize: 11, fontFamily: 'Inter_500Medium', color: C.muted, textAlign: 'center' },
  themePreviewBanner: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  themePreviewNav: { paddingHorizontal: 14, paddingVertical: 10 },
  themePreviewNavText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  themePreviewBody: { padding: 14, gap: 8 },
  themePreviewTitle: { height: 14, borderRadius: 7, width: '55%' },
  themePreviewLine: { height: 9, borderRadius: 5 },
  themePreviewAccent: { height: 28, borderRadius: 14, width: '40%', marginTop: 4 },
});
